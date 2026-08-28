module.exports = async (req, res) => {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!REPLICATE_API_KEY) {
    res.status(500).json({ error: 'REPLICATE_API_KEY not set' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { predictionId, imageBase64, imageType } = body;

    // --- POLL STATUS ---
    if (predictionId) {
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` }
      });
      const pollData = await pollRes.json();
      res.status(200).json(pollData);
      return;
    }

    // --- START PREDICTION ---
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 required' });
      return;
    }

    const imageData = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`;

    const response = await fetch('https://api.replicate.com/v1/models/tencent/hunyuan-3d-3.1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          image: imageData,
          num_inference_steps: 20,
          guidance_scale: 7.5
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.detail || 'Replicate API error' });
      return;
    }

    res.status(200).json({ ...data, predictionId: data.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
