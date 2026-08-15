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

  // POST /photo3d - start prediction
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const imageBase64 = body.image;
      if (!imageBase64) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'No image provided' })
        };
      }

      const response = await fetch('https://api.replicate.com/v1/models/tencent/hunyuan3d-2/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            image: imageBase64,
            texture: true,
            steps: 50,
            guidance_scale: 7.5,
            seed: 42
          }
        })
      });

      const prediction = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ id: prediction.id, status: prediction.status })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // GET /photo3d?id=xxx - poll prediction
  if (event.httpMethod === 'GET') {
    try {
      const id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'No prediction id' })
        };
      }

      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` }
      });

      const prediction = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          status: prediction.status,
          output: prediction.output,
          error: prediction.error
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
};
