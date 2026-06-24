export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { image, prompt } = req.body;
  const apiKey = process.env.REPLICATE_API_TOKEN;
  try {
    const response = await fetch('https://api.replicate.com/v1/models/stability-ai/stable-diffusion-img2img/versions/15a3689ee13b0d2616e98820eca31d4af4f36ad8eaa87dd5cefcaad554ffaf76/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Prefer': 'wait=60' },
      body: JSON.stringify({ input: { prompt, image, prompt_strength: 0.6, num_inference_steps: 30, guidance_scale: 7.5 } })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error });
    let imgUrl = data.output?.[0];
    if (!imgUrl && data.urls?.get) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(data.urls.get, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        const pollData = await poll.json();
        if (pollData.status === 'succeeded') { imgUrl = pollData.output?.[0]; break; }
        if (pollData.status === 'failed') return res.status(500).json({ error: 'Geração falhou' });
      }
    }
    if (!imgUrl) return res.status(500).json({ error: 'Sem resultado' });
    res.status(200).json({ output: imgUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
