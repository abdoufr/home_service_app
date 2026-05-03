import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { authenticate, authorize } from '../middleware/auth';
import admin from 'firebase-admin';

const router = Router();

// Helper to get nested data (simulating joins)
const getPopulatedService = async (srv: any) => {
  const workerDoc = await db.collection('users').doc(srv.workerId).get();
  const catDoc = await db.collection('categories').doc(srv.categoryId).get();
  return {
    ...srv,
    worker: workerDoc.exists ? { name: workerDoc.data()?.name, email: workerDoc.data()?.email } : null,
    category: catDoc.exists ? catDoc.data() : null
  };
};

// Get categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('categories').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get all services
router.get('/', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('services').get();
    const services = await Promise.all(snapshot.docs.map(async doc => {
      return getPopulatedService({ id: doc.id, ...doc.data() });
    }));
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

    const serviceRef = db.collection('services').doc();
    const serviceData = {
      id: serviceRef.id,
      title,
      description,
      price,
      categoryId,
      workerId,
      createdAt: new Date().toISOString()
    };
    await serviceRef.set(serviceData);
    res.status(201).json(serviceData);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service' });
  }
});

// Order a service (Clients only)
router.post('/orders', authenticate, authorize(['CLIENT']), async (req: Request, res: Response) => {
  try {
    const { serviceId, scheduledAt } = req.body;
    const clientId = (req as any).user.userId;

    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) return res.status(404).json({ message: 'Service not found' });
    const service = serviceDoc.data();

    const orderRef = db.collection('orders').doc();
    const orderData = {
      id: orderRef.id,
      serviceId,
      clientId,
      status: 'PENDING',
      scheduledAt: scheduledAt || null,
      createdAt: new Date().toISOString()
    };
    await orderRef.set(orderData);

    // Notify worker
    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      userId: service?.workerId,
      type: 'NEW_ORDER',
      content: `Vous avez reçu une nouvelle commande pour "${service?.title}"`,
      linkId: orderRef.id,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ ...orderData, service });
  } catch (error) {
    res.status(500).json({ message: 'Error placing order' });
  }
});

// Get worker's own services
router.get('/worker/me', authenticate, authorize(['WORKER']), async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).user.userId;
    const snapshot = await db.collection('services').where('workerId', '==', workerId).get();
    const services = await Promise.all(snapshot.docs.map(async doc => {
      const catDoc = await db.collection('categories').doc(doc.data().categoryId).get();
      return { id: doc.id, ...doc.data(), category: catDoc.data() };
    }));
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your services' });
  }
});

// Delete a service
router.delete('/:id', authenticate, authorize(['WORKER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.id;
    await db.collection('services').doc(serviceId).delete();
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service' });
  }
});

// Get orders for a client
router.get('/orders/client', authenticate, authorize(['CLIENT']), async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user.userId;
    const snapshot = await db.collection('orders').where('clientId', '==', clientId).get();
    const orders = await Promise.all(snapshot.docs.map(async doc => {
      const ord = doc.data();
      const serviceDoc = await db.collection('services').doc(ord.serviceId).get();
      const service = serviceDoc.exists ? await getPopulatedService({ id: serviceDoc.id, ...serviceDoc.data() }) : null;
      return { id: doc.id, ...ord, service };
    }));
    res.json(orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get orders for a worker
router.get('/orders/worker', authenticate, authorize(['WORKER']), async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).user.userId;
    const snapshot = await db.collection('orders').get(); // Note: Firestore doesn't support nested where easily without denormalization
    const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const workerOrders = [];
    for (const ord of allOrders as any[]) {
      const serviceDoc = await db.collection('services').doc(ord.serviceId).get();
      if (serviceDoc.exists && serviceDoc.data()?.workerId === workerId) {
        const clientDoc = await db.collection('users').doc(ord.clientId).get();
        workerOrders.push({
          ...ord,
          client: clientDoc.exists ? { name: clientDoc.data()?.name, email: clientDoc.data()?.email, phone: clientDoc.data()?.phone } : null,
          service: { id: serviceDoc.id, ...serviceDoc.data() }
        });
      }
    }
    res.json(workerOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status
router.patch('/orders/:id/status', authenticate, authorize(['WORKER', 'CLIENT']), async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) return res.status(404).json({ message: 'Order not found' });
    const order = orderDoc.data();

    await orderRef.update({ status, updatedAt: new Date().toISOString() });

    if (status === 'ACCEPTED') {
      const notifRef = db.collection('notifications').doc();
      await notifRef.set({
        id: notifRef.id,
        userId: order?.clientId,
        type: 'ORDER_ACCEPTED',
        content: `Votre commande a été acceptée !`,
        linkId: orderId,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ id: orderId, ...order, status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order' });
  }
});

// Notifications
router.get('/notifications', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const snapshot = await db.collection('notifications').where('userId', '==', userId).get();
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(notifs.sort((a:any, b:any) => b.createdAt.localeCompare(a.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

router.patch('/notifications/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    await db.collection('notifications').doc(req.params.id).update({ isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Messages
router.get('/orders/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const snapshot = await db.collection('messages').where('orderId', '==', orderId).get();
    const messages = await Promise.all(snapshot.docs.map(async doc => {
      const msg = doc.data();
      const senderDoc = await db.collection('users').doc(msg.senderId).get();
      return { id: doc.id, ...msg, sender: { name: senderDoc.data()?.name, id: senderDoc.id } };
    }));
    res.json(messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

router.post('/orders/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user.userId;
    const { content } = req.body;

    const msgRef = db.collection('messages').doc();
    const msgData = {
      id: msgRef.id,
      orderId,
      senderId: userId,
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    await msgRef.set(msgData);

    const orderDoc = await db.collection('orders').doc(orderId).get();
    const order = orderDoc.data();
    const serviceDoc = await db.collection('services').doc(order?.serviceId).get();
    const service = serviceDoc.data();

    const recipientId = order?.clientId === userId ? service?.workerId : order?.clientId;
    const senderDoc = await db.collection('users').doc(userId).get();

    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      userId: recipientId,
      type: 'MESSAGE',
      content: `Nouveau message de ${senderDoc.data()?.name}`,
      linkId: orderId,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ ...msgData, sender: { name: senderDoc.data()?.name, id: userId } });
  } catch (error) {
    res.status(500).json({ message: 'Error posting message' });
  }
});

// Support
router.get('/support/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const snapshot = await db.collection('supportMessages').where('userId', '==', userId).get();
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(messages.sort((a:any, b:any) => a.createdAt.localeCompare(b.createdAt)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching support messages' });
  }
});

router.post('/support/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { content } = req.body;
    const msgRef = db.collection('supportMessages').doc();
    const msgData = { id: msgRef.id, userId, content, isAdmin: false, createdAt: new Date().toISOString() };
    await msgRef.set(msgData);
    res.json(msgData);
  } catch (error) {
    res.status(500).json({ message: 'Error sending support message' });
  }
});

export default router;
