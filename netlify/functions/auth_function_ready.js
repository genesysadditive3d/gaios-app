// netlify/functions/auth.js
// Simple role-based auth - no Firebase Admin needed

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { email } = JSON.parse(event.body || '{}');
    
    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'email required' }) };
    }

    const emailLower = email.toLowerCase().trim();

    // Role map from environment variables
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const productionEmail = (process.env.PRODUCTION_EMAIL || '').toLowerCase().trim();

    let role = 'customer';
    if (emailLower === adminEmail) role = 'admin';
    else if (emailLower === productionEmail) role = 'production';

    // Scan point emails (add more as partners join)
    const scanPointEmails = [
      // 'delhi@genesysadditive3dcreation.com',
      // 'mumbai@genesysadditive3dcreation.com',
    ];
    if (scanPointEmails.includes(emailLower)) role = 'scanpoint';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        email: emailLower,
        role: role,
        displayName: emailLower.split('@')[0],
        verified: true
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
