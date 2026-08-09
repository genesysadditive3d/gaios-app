exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageBase64, imageType } = JSON.parse(event.body);
    const HF_API_KEY = process.env.HF_API_KEY;

    if (!HF_API_KEY) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'HF_API_KEY not set' }) 
      };
    }

    const response = await fetch(
      'https://api-inference.huggingface.co/models/openai/shap-e',
      {
        method: 'POST',
        headers: {
          'Authorization': Bearer ${HF_API_KEY},
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: imageBase64 }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: err }) 
      };
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: result }),
    };

  } catch (err) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
