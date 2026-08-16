import express from 'express';
import { adminDb } from '../middleware/firebaseAdmin.js';
import { requireAdmin } from '../middleware/security.js';

const router = express.Router();

router.post('/update-order-status', requireAdmin, async (req, res) => {
  try {
    const { orderId, newStatus, adminMessage, courierPartner, trackingInfo } = req.body;

    if (!orderId || !newStatus) {
      return res.status(400).json({ error: 'orderId and newStatus are required' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    
    // Use Firestore transaction or direct update
    // Update basic fields
    const updateData = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    // Add status history
    const newHistory = {
      status: newStatus,
      timestamp: new Date().toISOString()
    };

    // Add courier info if present
    if (courierPartner) updateData.courierPartner = courierPartner;
    if (trackingInfo) updateData.trackingInfo = trackingInfo;
    if (adminMessage) updateData.adminMessage = adminMessage;

    // To append to statusHistory, we can fetch first then update
    const snap = await orderRef.get();
    if (!snap.exists) {
        return res.status(404).json({ error: 'Order not found' });
    }

    let history = snap.data().statusHistory || [];
    history.push(newHistory);
    updateData.statusHistory = history;

    // Delivery specific logic
    if (newStatus === 'Delivered' && snap.data().paymentMethod === 'Cash on Delivery') {
        updateData.paymentStatus = 'Paid';
    }

    await orderRef.update(updateData);

    return res.status(200).json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({ error: 'Failed to update order.' });
  }
});

router.post('/update-print-status', requireAdmin, async (req, res) => {
  try {
    const { orderId, printStatus } = req.body;
    if (!orderId || !printStatus) {
      return res.status(400).json({ error: 'orderId and printStatus are required' });
    }
    const orderRef = adminDb.collection('orders').doc(orderId);
    await orderRef.update({
        print_status: printStatus,
        printed_at: printStatus === 'PRINTED' ? Date.now() : null
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update Print Status Error:", error);
    return res.status(500).json({ error: 'Failed to update print status.' });
  }
});

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const snapshot = await adminDb.collection('orders').orderBy('timestamp', 'desc').get();
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

router.post('/update-settings', requireAdmin, async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'type and data are required' });
    }
    const allowedTypes = ['business', 'payment', 'delivery'];
    if (!allowedTypes.includes(type)) {
       return res.status(400).json({ error: 'Invalid settings type' });
    }
    
    // Add server timestamp
    const updateData = {
       ...data,
       updatedAt: new Date().toISOString()
    };
    
    await adminDb.collection('settings').doc(type).set(updateData, { merge: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
});

export default router;
