export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, prompt } = req.body;
  const apiKey = process.env.REPLICATE_API_TOKEN;

  try {
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "8abccf52e7cba9f6e82317253f4a3549082e966db5584e92c808ece132037776",
        input: {
          prompt: prompt,
          image: image,
          strength: 0.5,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          negative_prompt: "ugly, blurry, low quality, distorted"
        }
      })
    });

    const prediction = await startRes.json();
    if (prediction.error) return res.status(400).json({ error: prediction.error });
    
    // Retorna o ID e a URL de polling para o navegador fazer o acompanhamento
    return res.status(200).json({ 
      id: prediction.id,
      poll_url: prediction.urls?.get
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
