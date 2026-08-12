import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // CORS setup for testing/local
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys are missing in Vercel environment variables.');
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, receipt } = req.body || {};

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0 || amount >= 10000000) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }

    if (receipt && (typeof receipt !== 'string' || receipt.length > 40 || !/^[a-zA-Z0-9_]+$/.test(receipt))) {
      return res.status(400).json({ error: 'Invalid receipt format' });
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in paise (smallest currency unit)
      currency: "INR",
      receipt: receipt || "receipt_order_" + Date.now(),
    };

    const order = await instance.orders.create(options);
    return res.status(200).json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
}
