// Vercel serverless function — creates a Razorpay order server-side
// (must happen server-side because it needs the secret key). Returns 501
// until RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set in Vercel, so the
// customer dashboard's Razorpay button can exist now and light up later
// without any code change.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  if (!KEY_ID || !KEY_SECRET) {
    res.status(501).json({ error: 'not_configured', message: 'Razorpay keys not set yet' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { amount, orderId } = body; // amount in INR rupees

    if (!amount || !orderId) {
      res.status(400).json({ error: 'amount and orderId required' });
      return;
    }

    const Razorpay = require('razorpay');
    const instance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

    const rzpOrder = await instance.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: orderId,
      notes: { gaiosOrderId: orderId }
    });

    res.status(200).json({ razorpayOrderId: rzpOrder.id, keyId: KEY_ID, amount: rzpOrder.amount, currency: rzpOrder.currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
