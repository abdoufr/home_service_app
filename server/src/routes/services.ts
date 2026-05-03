import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get all services
router.get('/', async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        worker: { select: { name: true, email: true } },
        category: true
      }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// Create a service (Workers only)
router.post('/', authenticate, authorize(['WORKER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { title, description, price, categoryId } = req.body;
    const workerId = (req as any).user.userId;

    const service = await prisma.service.create({
      data: {
        title,
        description,
        price,
        categoryId,
        workerId
      }
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service' });
  }
});

// Order a service (Clients only)
router.post('/orders', authenticate, authorize(['CLIENT']), async (req: Request, res: Response) => {
  try {
    const { serviceId, scheduledAt } = req.body;
    const clientId = (req as any).user.userId;

    const order = await prisma.order.create({
      data: {
        serviceId,
        clientId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null
      },
      include: { service: true }
    });

    await prisma.notification.create({
      data: {
        userId: order.service.workerId,
        type: 'NEW_ORDER',
        content: `Vous avez reçu une nouvelle commande pour "${order.service.title}"`,
        linkId: order.id
      }
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error placing order' });
  }
});

// Get worker's own services
router.get('/worker/me', authenticate, authorize(['WORKER']), async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).user.userId;
    const services = await prisma.service.findMany({
      where: { workerId },
      include: { category: true }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your services' });
  }
});

// Delete a service
router.delete('/:id', authenticate, authorize(['WORKER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.id as string;
    const workerId = (req as any).user.userId;
    const role = (req as any).user.role;

    const whereClause = role === 'ADMIN' ? { id: serviceId } : { id: serviceId, workerId };

    await prisma.service.deleteMany({
      where: whereClause
    });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service' });
  }
});

// Get all categories (accessible to everyone authenticated)
router.get('/categories', authenticate, async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ 
      include: { _count: { select: { services: true } } } 
    });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get orders for a client
router.get('/orders/client', authenticate, authorize(['CLIENT']), async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user.userId;
    const orders = await prisma.order.findMany({
      where: { clientId },
      include: {
        service: {
          include: { worker: { select: { name: true, email: true, phone: true } }, category: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get orders for a worker
router.get('/orders/worker', authenticate, authorize(['WORKER']), async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).user.userId;
    const orders = await prisma.order.findMany({
      where: { service: { workerId } },
      include: {
        client: { select: { name: true, email: true, phone: true } },
        service: { include: { category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status
router.patch('/orders/:id/status', authenticate, authorize(['WORKER', 'CLIENT']), async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { service: true } });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isWorker = role === 'WORKER' && order.service.workerId === userId;
    const isClient = role === 'CLIENT' && order.clientId === userId;

    if (!isWorker && !isClient) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (isClient && status !== 'CANCELLED') {
      return res.status(403).json({ message: 'Clients can only cancel orders' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { service: true }
    });

    if (status === 'ACCEPTED') {
      await prisma.notification.create({
        data: {
          userId: updatedOrder.clientId,
          type: 'ORDER_ACCEPTED',
          content: `Votre commande pour "${updatedOrder.service.title}" a été acceptée !`,
          linkId: updatedOrder.id
        }
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order' });
  }
});

// Get all notifications
router.get('/notifications', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { isRead: true }
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Get messages for an order
router.get('/orders/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const userId = (req as any).user.userId;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { service: true } });
    if (!order || (order.clientId !== userId && order.service.workerId !== userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const isClient = order.clientId === userId;
    const clearedAt = isClient ? order.clientChatClearedAt : order.workerChatClearedAt;

    // Auto-cleanup: if CANCELLED or COMPLETED and older than 7 days
    if (['CANCELLED', 'COMPLETED'].includes(order.status)) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (order.updatedAt < oneWeekAgo) {
        await prisma.message.deleteMany({ where: { orderId } });
        return res.json([]);
      }
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: { orderId, senderId: { not: userId }, isRead: false },
      data: { isRead: true }
    });

    const messages = await prisma.message.findMany({
      where: { 
        orderId,
        createdAt: { gt: clearedAt || new Date(0) }
      },
      include: { sender: { select: { name: true, id: true } } },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Post a message to an order
router.post('/orders/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const userId = (req as any).user.userId;
    const { content } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { service: true } });
    if (!order || (order.clientId !== userId && order.service.workerId !== userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (['CANCELLED', 'COMPLETED'].includes(order.status)) {
      return res.status(403).json({ message: 'Chat is closed for this order' });
    }

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: userId,
        content
      },
      include: { sender: { select: { name: true, id: true } } }
    });

    // No need to reset clearedAt flags, filtering logic handles new messages automatically

    // Notify the other party
    const recipientId = order.clientId === userId ? order.service.workerId : order.clientId;
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'MESSAGE',
        content: `Nouveau message de ${message.sender.name}: "${content.length > 20 ? content.substring(0,20)+'...' : content}"`,
        linkId: order.id
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error posting message' });
  }
});

// Delete all messages for an order
router.delete('/orders/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const userId = (req as any).user.userId;

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { service: true } });
    if (!order || (order.clientId !== userId && order.service.workerId !== userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const isClient = order.clientId === userId;
    await prisma.order.update({
      where: { id: orderId },
      data: isClient ? { clientChatClearedAt: new Date() } : { workerChatClearedAt: new Date() }
    });
    
    res.json({ message: 'Discussion deleted for you' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting discussion' });
  }
});

// --- SUPPORT CHAT ---

// Get support messages for current user
router.get('/support/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const messages = await prisma.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching support messages' });
  }
});

// Send support message
router.post('/support/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { content } = req.body;
    const message = await prisma.supportMessage.create({
      data: { userId, content, isAdmin: false }
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending support message' });
  }
});

export default router;
