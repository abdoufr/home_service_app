import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-jwt-12345';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role, latitude, longitude } = req.body;
    
    if (!db) {
      return res.status(503).json({ message: 'Database not available', details: 'Firebase failed to initialize' });
    }

    if (!['ADMIN', 'WORKER', 'CLIENT'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!userSnapshot.empty) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Read approval settings from Firestore
    const settingsDoc = await db.collection('settings').doc('global').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : { autoApproveUsers: true, autoApproveWorkers: false };
    
    let approved = false;
    if (role === 'ADMIN') approved = true;
    else if (role === 'CLIENT') approved = settings?.autoApproveUsers ?? true;
    else if (role === 'WORKER') approved = settings?.autoApproveWorkers ?? false;

    const userRef = db.collection('users').doc();
    const userData = {
      id: userRef.id,
      email,
      password: hashedPassword,
      name,
      phone,
      role,
      approved,
      latitude: latitude || null,
      longitude: longitude || null,
      createdAt: new Date().toISOString()
    };

    await userRef.set(userData);

    res.status(201).json({ message: 'User created successfully', userId: userRef.id, approved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!db) {
      return res.status(503).json({ message: 'Database not available', details: 'Firebase failed to initialize' });
    }

    const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userSnapshot.empty) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userSnapshot.docs[0].data();
    if (!user.approved) {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ message: 'Logged in successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.patch('/profile/location', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { latitude, longitude } = req.body;
    
    await db.collection('users').doc(userId).update({
      latitude,
      longitude
    });
    
    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating location' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    if (!db) {
      return res.status(503).json({ message: 'Database not available', details: 'Firebase failed to initialize' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userDoc.data();
    res.json({ 
      id: user?.id, 
      email: user?.email, 
      name: user?.name, 
      role: user?.role, 
      approved: user?.approved,
      latitude: user?.latitude,
      longitude: user?.longitude
    });
  } catch (error: any) {
    console.error("Auth Me Error:", error);
    res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});

export default router;
