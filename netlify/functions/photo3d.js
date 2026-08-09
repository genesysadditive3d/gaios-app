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

    // Step 1: Prediction create karo
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'af85b52698bc6e51ba35a19571de3fc3ce73e9ad3c6a3cca7929386d94e5c6c4',
        input: {
          image: dataUrl,
          guidance_scale: 3,
          num_inference_steps: 75,
          frame_size: 256
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
    let result = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` }
      });

      const pollData = await pollRes.json();

      if (pollData.status === 'succeeded') {
        result = pollData.output;
        break;
      } else if (pollData.status === 'failed') {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: pollData.error || '3D generation failed' })
        };
      }
    }

    if (!result) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Timeout: Processing too long' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, output: result })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
