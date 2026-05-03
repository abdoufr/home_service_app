import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-jwt-12345';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!['ADMIN', 'WORKER', 'CLIENT'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Read approval settings from DB
    const settings = await prisma.settings.findFirst();
    let approved = false;
    if (role === 'ADMIN') approved = true;
    else if (role === 'CLIENT') approved = settings?.autoApproveUsers ?? true;
    else if (role === 'WORKER') approved = settings?.autoApproveWorkers ?? false;

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, phone, role, approved }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id, approved });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

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
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.userId },
      select: { id: true, email: true, name: true, role: true, approved: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── Google OAuth ─────────────────────────────────────────
import passport from '../config/passport';

router.get('/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=oauth_failed' }),
  (req: Request, res: Response) => {
    const { token, user } = (req as any).user;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Redirect back to the frontend after successful login
    const redirect = user.role === 'ADMIN' ? '/admin' : user.role === 'WORKER' ? '/worker' : '/services';
    res.redirect(`http://localhost:5173${redirect}`);
  }
);

export default router;
