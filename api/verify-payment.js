import crypto from 'crypto';

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    
    if (
      !razorpay_order_id || typeof razorpay_order_id !== 'string' ||
      !razorpay_payment_id || typeof razorpay_payment_id !== 'string' ||
      !razorpay_signature || typeof razorpay_signature !== 'string'
    ) {
      return res.status(400).json({ error: 'Missing or invalid payment verification parameters' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error('Razorpay Key Secret is missing');
    }
    
    // Create expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');
    
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(razorpay_signature);

    const isMatch = expectedBuffer.length === signatureBuffer.length && 
                    crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (isMatch) {
      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    return res.status(500).json({ error: 'Payment verification failed. Please contact support.' });
  }
}
