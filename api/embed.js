export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const text = (body.text || '').trim()

    if (!text) {
      res.status(400).json({ error: 'Text is required' })
      return
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('OpenAI error', detail)
      res.status(response.status).json({ error: 'Failed to generate embedding' })
      return
    }

    const { data } = await response.json()
    const embedding = data?.[0]?.embedding

    if (!embedding) {
      res.status(500).json({ error: 'Embedding missing from OpenAI response' })
      return
    }

    res.status(200).json({ embedding })
  } catch (error) {
    console.error('Embedding handler error', error)
    res.status(500).json({ error: 'Unexpected server error' })
  }
}
