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
        version: "15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
        input: {
          prompt: prompt,
          image: image,
          prompt_strength: 0.6,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          negative_prompt: "ugly, blurry, low quality, distorted"
        }
      })
    });

    const prediction = await startRes.json();
    if (prediction.error) return res.status(400).json({ error: prediction.error });
    return res.status(200).json({ id: prediction.id });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
