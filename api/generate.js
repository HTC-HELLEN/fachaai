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
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: "a9758cbfbd5f3c2094457d996681af52552901daa44f4a338dece2faf8a87f90",
        input: {
          prompt: prompt,
          image: image,
          prompt_strength: 0.5,
          num_inference_steps: 20,
          guidance_scale: 7
        }
      })
    });

    const prediction = await startRes.json();
    
    if (prediction.error) {
      return res.status(400).json({ error: prediction.error });
    }

    if (prediction.output && prediction.output.length > 0) {
      return res.status(200).json({ output: prediction.output[0] });
    }

    if (prediction.urls?.get) {
      const pollUrl = prediction.urls.get;
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const pollRes = await fetch(pollUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const pollData = await pollRes.json();
        if (pollData.status === 'succeeded' && pollData.output?.length > 0) {
          return res.status(200).json({ output: pollData.output[0] });
        }
        if (pollData.status === 'failed') {
          return res.status(500).json({ error: 'A IA não conseguiu processar a imagem.' });
        }
      }
    }

    return res.status(500).json({ error: 'Tempo esgotado. Tente novamente.' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
