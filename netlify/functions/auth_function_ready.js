// netlify/functions/auth.js
// Firebase Admin SDK via REST API (no npm needed)

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { action, idToken, email } = JSON.parse(event.body || '{}');

    // ── ROLE MAP — Gopal ji यहाँ users add करेंगे ──
    const ROLE_MAP = {
      // Admin
      [process.env.ADMIN_EMAIL]: 'admin',
      // Production
      [process.env.PRODUCTION_EMAIL]: 'production',
      // Scan Points — जब add हों तब यहाँ डालें
      // 'jaipur@genesysadditive3dcreation.com': 'scanpoint',
      // Customers — सब customer हैं by default
    };

    if (action === 'verify') {
      // Firebase token verify via REST
      const firebaseApiKey = process.env.FIREBASE_API_KEY;
      const projectId = process.env.gaios-app;

      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyData.users || verifyData.users.length === 0) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
      }

      const user = verifyData.users[0];
      const userEmail = user.email?.toLowerCase();
      const role = ROLE_MAP[userEmail] || 'customer';

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          uid: user.localId,
          email: userEmail,
          role: role,
          displayName: user.displayName || userEmail?.split('@')[0],
          verified: true
        })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };

  } catch (err) {
    console.error('Auth error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
