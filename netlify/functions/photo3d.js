exports.handler = async (event) => {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

  if (!REPLICATE_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'REPLICATE_API_KEY not set' })
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const imageBase64 = body.imageBase64;
      const imageType = body.imageType || 'image/jpeg';

      if (!imageBase64) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'No image provided' })
        };
      }

      const dataUri = data:${imageType};base64,${imageBase64};

      const createResponse = await fetch('https://api.replicate.com/v1/models/tencent/hunyuan-3d-3.1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': Token ${REPLICATE_API_KEY},
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: { image: dataUri }
        })
      });

      const prediction = await createResponse.json();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ predictionId: prediction.id, status: prediction.status })
      };

    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      const predictionId = event.queryStringParameters && event.queryStringParameters.id;

      if (!predictionId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'No prediction ID provided' })
        };
      }

      const pollResponse = await fetch(https://api.replicate.com/v1/predictions/${predictionId}, {
        headers: { 'Authorization': Token ${REPLICATE_API_KEY} }
      });

      const result = await pollResponse.json();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result)
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
