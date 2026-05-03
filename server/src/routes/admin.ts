import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize(['ADMIN']));

// ── GET /api/admin/users — list all non-admin users ──────────────────────────
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { status } = req.query; // ?status=pending | approved | all
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
        ...(status === 'pending' ? { approved: false } : {}),
        ...(status === 'approved' ? { approved: true } : {}),
      },
      select: {
        id: true, email: true, name: true, role: true,
        approved: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ── PATCH /api/admin/users/:id/approve — approve a user ──────────────────────
router.patch('/users/:id/approve', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { approved: true },
      select: { id: true, name: true, email: true, role: true, approved: true },
    });
    res.json({ message: 'User approved', user });
  } catch {
    res.status(404).json({ message: 'User not found' });
  }
});

// ── PATCH /api/admin/users/:id/reject — reject (delete) a user ───────────────
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'User rejected and removed' });
  } catch {
    res.status(404).json({ message: 'User not found' });
  }
});

// ── GET /api/admin/settings — get current approval settings ──────────────────
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: { autoApproveUsers: true, autoApproveWorkers: false },
      });
    }
    res.json(settings);
  } catch {
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// ── PATCH /api/admin/settings — update approval settings ─────────────────────
router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const { autoApproveUsers, autoApproveWorkers } = req.body;
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: { autoApproveUsers, autoApproveWorkers },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          ...(autoApproveUsers !== undefined ? { autoApproveUsers } : {}),
          ...(autoApproveWorkers !== undefined ? { autoApproveWorkers } : {}),
        },
      });
    }
    res.json(settings);
  } catch {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalServices, totalOrders, pendingUsers] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.service.count(),
      prisma.order.count(),
      prisma.user.count({ where: { approved: false } }),
    ]);
    res.json({ totalUsers, totalServices, totalOrders, pendingUsers });
  } catch {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// CATEGORIES (Moved to services.ts for accessibility)


router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({ data: { name } });
    res.json(category);
  } catch {
    res.status(500).json({ message: 'Error creating category' });
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Category deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// ── SUPPORT CHAT FOR ADMIN ───────────────────────────────────────────────────

// Get all users who have support messages
router.get('/support/conversations', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { supportMessages: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        supportMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, isRead: true }
        }
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching support conversations' });
  }
});

// Get messages for a user
router.get('/support/messages/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const messages = await prisma.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Reply to user
router.post('/support/messages/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { content } = req.body;
    const message = await prisma.supportMessage.create({
      data: { userId, content, isAdmin: true }
    });
    
    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        type: 'MESSAGE',
        content: `Admin: ${content.substring(0, 50)}...`,
        linkId: 'support'
      }
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending reply' });
  }
});

export default router;
