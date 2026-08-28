// Vercel serverless function — verifies a Razorpay payment signature
// server-side (HMAC with the secret key — never trust the client's word
// that a payment succeeded) then marks the order paid via Firebase Admin.
// Returns 501 until RAZORPAY_KEY_SECRET + FIREBASE_SERVICE_ACCOUNT_KEY are
// both set in Vercel.
const crypto = require('crypto');

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

  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!KEY_SECRET || !SERVICE_ACCOUNT_JSON) {
    res.status(501).json({ error: 'not_configured', message: 'Razorpay/Firebase Admin not set up yet' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gaiosOrderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !gaiosOrderId) {
      res.status(400).json({ error: 'missing razorpay fields' });
      return;
    }

    const expected = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      res.status(400).json({ error: 'signature_mismatch', message: 'Payment could not be verified' });
      return;
    }

    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SERVICE_ACCOUNT_JSON)) });
    }
    const db = admin.firestore();

    await db.collection('orders').doc(gaiosOrderId).update({
      status: 'paid',
      'payment.status': 'paid',
      'payment.method': 'razorpay',
      'payment.razorpayOrderId': razorpay_order_id,
      'payment.razorpayPaymentId': razorpay_payment_id,
      timeline: admin.firestore.FieldValue.arrayUnion({
        status: 'paid',
        at: new Date().toISOString(),
        by: 'razorpay-verify'
      })
    });

    res.status(200).json({ verified: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
