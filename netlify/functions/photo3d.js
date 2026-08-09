exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

  if (!REPLICATE_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'REPLICATE_API_KEY not set' })
    };
  }

  try {
    const { imageBase64, imageType } = JSON.parse(event.body);
    const dataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`;

    // Step 1: Prediction create karo — TripoSR model (image to 3D)
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '0e4670a341e1af5e04fc1b2ccb7f4a12af2e9c9de5b89bce03f3f544b440a4c4',
        input: {
          image: dataUrl,
          do_remove_background: true,
          foreground_ratio: 0.85
        }
      })
    });

    const prediction = await createRes.json();

    if (!prediction.id) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: prediction.detail || 'Failed to create prediction' })
      };
    }

    // Step 2: Poll karo result ke liye
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` }
      });

      const pollData = await pollRes.json();

      if (pollData.status === 'succeeded') {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, output: pollData.output })
        };
      } else if (pollData.status === 'failed') {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: pollData.error || '3D generation failed' })
        };
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Timeout: Processing too long, try again' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
