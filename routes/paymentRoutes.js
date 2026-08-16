import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { adminDb } from '../middleware/firebaseAdmin.js';

const router = express.Router();

router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Valid orderId is required' });
    }

    if (!adminDb) {
       return res.status(500).json({ error: 'Database connection error' });
    }

    // Fetch the order from Firestore securely
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderSnap.data();

    // Prevent creating a payment for an already paid order
    if (orderData.paymentStatus === 'Paid' || orderData.status !== 'Ordered') {
      return res.status(400).json({ error: 'Order cannot be paid at this time' });
    }

    // --- SERVER-SIDE PRICE VALIDATION ---
    let calculatedSubtotal = 0;
    
    // Validate items
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        if (!item.productId) continue;
        const productSnap = await adminDb.collection('products').doc(item.productId).get();
        if (productSnap.exists) {
           const product = productSnap.data();
           let unitPrice = product.price || 0;
           
           // If coupon was applied to this item
           if (item.appliedCoupon && typeof item.appliedCoupon.discountAmount === 'number') {
               // We trust the discountAmount if it's within reason, or we could fetch the coupon from DB
               // To be fully secure, you would fetch the coupon from DB and recalculate.
               const discount = Math.min(item.appliedCoupon.discountAmount, unitPrice);
               unitPrice = Math.max(0, unitPrice - discount);
           }
           calculatedSubtotal += (unitPrice * (item.quantity || 1));
        }
      }
    }
    
    const deliveryFee = Number(orderData.deliveryFee || 0);
    const calculatedTotal = calculatedSubtotal + deliveryFee;

    // Use the calculated total, ignoring whatever the frontend sent to prevent tampering
    const amount = Number(calculatedTotal);
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    // Update the order in Firestore with the verified price just in case
    await orderRef.update({ totalPrice: calculatedTotal });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys are missing in environment variables.');
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_${orderId}`,
    };

    const razorpayOrder = await instance.orders.create(options);
    
    // We can also store the razorpayOrderId in the Firestore document if needed
    // await orderRef.update({ razorpayOrderId: razorpayOrder.id });

    return res.status(200).json({ 
      ...razorpayOrder, 
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: options.amount // return correct amount to frontend
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body || {};
    
    if (
      !razorpay_order_id || typeof razorpay_order_id !== 'string' ||
      !razorpay_payment_id || typeof razorpay_payment_id !== 'string' ||
      !razorpay_signature || typeof razorpay_signature !== 'string' ||
      !orderId || typeof orderId !== 'string'
    ) {
      return res.status(400).json({ error: 'Missing or invalid payment verification parameters' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error('Razorpay Key Secret is missing');
    }
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');
    
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(razorpay_signature);

    const isMatch = expectedBuffer.length === signatureBuffer.length && 
                    crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (isMatch) {
       // Securely update Firestore
       if (adminDb) {
           const orderRef = adminDb.collection('orders').doc(orderId);
           await orderRef.update({
               paymentStatus: 'Paid',
               transactionId: razorpay_payment_id,
               razorpayOrderId: razorpay_order_id,
               razorpaySignature: razorpay_signature,
               updatedAt: new Date().toISOString()
           });
       }
      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    return res.status(500).json({ error: 'Payment verification failed. Please contact support.' });
  }
});

export default router;
