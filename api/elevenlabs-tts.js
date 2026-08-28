// Vercel serverless function — text-to-speech via ElevenLabs.
// Voice is configurable via ELEVENLABS_VOICE_ID (set this to the "Anjali"
// voice ID once you have it in your ElevenLabs account — falls back to a
// generic multilingual voice until then). Never hardcode the API key here.
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

  const API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!API_KEY) {
    res.status(501).json({ error: 'ELEVENLABS_API_KEY not configured yet' });
    return;
  }

  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { text } = body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text required' });
      return;
    }
    // Keep requests small/cheap and avoid pathological payloads.
    const clipped = text.slice(0, 800);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: clipped,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: 'ElevenLabs API error', detail: errText });
      return;
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    res.status(200).json({ audio: audioBase64, mime: 'audio/mpeg' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
