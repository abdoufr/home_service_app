import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize(['ADMIN']));

// List users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let query = db.collection('users').where('role', '!=', 'ADMIN');
    
    if (status === 'pending') query = query.where('approved', '==', false);
    if (status === 'approved') query = query.where('approved', '==', true);

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users.sort((a:any, b:any) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Approve user
router.patch('/users/:id/approve', async (req: Request, res: Response) => {
  try {
    await db.collection('users').doc(req.params.id).update({ approved: true });
    res.json({ message: 'User approved' });
  } catch (error) {
    res.status(404).json({ message: 'User not found' });
  }
});

// Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    await db.collection('users').doc(req.params.id).delete();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(404).json({ message: 'User not found' });
  }
});

// Settings
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const doc = await db.collection('settings').doc('global').get();
    if (!doc.exists) {
      const defaultSettings = { autoApproveUsers: true, autoApproveWorkers: false };
      await db.collection('settings').doc('global').set(defaultSettings);
      return res.json(defaultSettings);
    }
    res.json(doc.data());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const { autoApproveUsers, autoApproveWorkers } = req.body;
    const settingsRef = db.collection('settings').doc('global');
    await settingsRef.set({
      autoApproveUsers: autoApproveUsers ?? true,
      autoApproveWorkers: autoApproveWorkers ?? false
    }, { merge: true });
    res.json({ autoApproveUsers, autoApproveWorkers });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// Stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [users, services, orders] = await Promise.all([
      db.collection('users').get(),
      db.collection('services').get(),
      db.collection('orders').get()
    ]);
    
    const totalUsers = users.docs.filter(d => d.data().role !== 'ADMIN').length;
    const pendingUsers = users.docs.filter(d => d.data().approved === false).length;

    res.json({
      totalUsers,
      totalServices: services.size,
      totalOrders: orders.size,
      pendingUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Categories
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const ref = db.collection('categories').doc();
    await ref.set({ name, createdAt: new Date().toISOString() });
    res.json({ id: ref.id, name });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category' });
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    await db.collection('categories').doc(req.params.id).delete();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// Support
router.get('/support/conversations', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('supportMessages').get();
    const allMsgs = snapshot.docs.map(doc => doc.data());
    const uniqueUserIds = Array.from(new Set(allMsgs.map(m => m.userId)));
    
    const conversations = await Promise.all(uniqueUserIds.map(async uid => {
      const userDoc = await db.collection('users').doc(uid).get();
      const lastMsgSnapshot = await db.collection('supportMessages').where('userId', '==', uid).get();
      const lastMsg = lastMsgSnapshot.docs.map(d => d.data()).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];
      
      return {
        id: uid,
        name: userDoc.data()?.name,
        email: userDoc.data()?.email,
        supportMessages: [lastMsg]
      };
    }));
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching support conversations' });
  }
});

router.get('/support/messages/:userId', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('supportMessages').where('userId', '==', req.params.userId).get();
    const messages = snapshot.docs.map(doc => doc.data());
    res.json(messages.sort((a:any, b:any) => a.createdAt.localeCompare(b.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

router.post('/support/messages/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    const msgRef = db.collection('supportMessages').doc();
    const msgData = { id: msgRef.id, userId, content, isAdmin: true, createdAt: new Date().toISOString() };
    await msgRef.set(msgData);

    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      userId,
      type: 'MESSAGE',
      content: `Admin: ${content.substring(0, 50)}...`,
      linkId: 'support',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json(msgData);
  } catch (error) {
    res.status(500).json({ message: 'Error sending reply' });
  }
});

export default router;
