exports.handler = async (event) => {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

  if (!REPLICATE_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'REPLICATE_API_KEY not set' })
    };
  }

  const path = event.path || '';
  
  // POST /photo3d — start prediction
  if (event.httpMethod === 'POST') {
    try {
      const { imageBase64, imageType, predictionId } = JSON.parse(event.body);

      // Agar predictionId hai to poll karo
      if (predictionId) {
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` }
        });
        const pollData = await pollRes.json();
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ status: pollData.status, output: pollData.output, error: pollData.error })
        };
      }

      // Naya prediction start karo
      const dataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`;
      const createRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '14bcf0ef5a1d638ef5cd78c30a72efb32344cdd9280efb5819fd15275cec85e3',
          input: {
            image: dataUrl,
            num_inference_steps: 50,
            guidance_scale: 7
          }
        })
      });

      const prediction = await createRes.json();
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          predictionId: prediction.id, 
          status: prediction.status,
          error: prediction.detail 
        })
      };

    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
