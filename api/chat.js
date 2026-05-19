/**
 * Vercel Serverless Function — AI chat proxy using Groq.
 *
 * Groq uses an OpenAI-compatible API format.
 * Free tier: 30 requests/minute, 14,400 requests/day.
 *
 * Environment variables (set in Vercel dashboard → Settings → Environment Variables):
 *   - GROQ_API_KEY → your Groq API key (required)
 *     Get one free at: https://console.groq.com/keys
 */

const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req, res) {
  // CORS on every response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'No API key configured. Set GROQ_API_KEY in environment variables.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body.messages || [];

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: Math.min(body.max_tokens || 512, 2048),
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      }),
    });

    const rawData = await upstream.text();
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      return res.status(upstream.status).json({
        error: rawData || `HTTP ${upstream.status}`,
      });
    }

    if (upstream.ok) {
      // Groq returns standard OpenAI format — pass it through directly
      return res.status(200).json(data);
    }

    const errMsg = data.error?.message || JSON.stringify(data);
    return res.status(upstream.status || 500).json({ error: errMsg });
  } catch (err) {
    console.error('[api/chat]', err);
    return res.status(500).json({ error: `Upstream request failed: ${err.message}` });
  }
}
