/**
 * Vercel Serverless Function — AI chat proxy.
 *
 * Supports two providers (auto-detected by which env var is set):
 *   1. ANTHROPIC_API_KEY  → calls Anthropic API directly  (recommended for websites)
 *   2. AGENTROUTER_API_KEY → calls AgentRouter             (CLI-only — will fail from web)
 *
 * Set the chosen var in Vercel dashboard → Settings → Environment Variables.
 */

const MODEL = 'claude-haiku-4-5-20251001';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const anthropicKey  = process.env.ANTHROPIC_API_KEY;
  const agentRouterKey = process.env.AGENTROUTER_API_KEY;

  if (!anthropicKey && !agentRouterKey) {
    return res.status(500).json({
      error: 'No API key configured. Set ANTHROPIC_API_KEY (recommended) or AGENTROUTER_API_KEY.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body.messages || [];

    // Anthropic format: system as top-level string, messages without system role
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const useAnthropic = !!anthropicKey;
    const url = useAnthropic
      ? 'https://api.anthropic.com/v1/messages'
      : 'https://agentrouter.org/v1/messages';
    const key = useAnthropic ? anthropicKey : agentRouterKey;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        system: systemMsg,
        messages: userMessages,
        max_tokens: Math.min(body.max_tokens || 512, 1024),
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      }),
    });

    const data = await upstream.json();

    // Normalize Anthropic response into OpenAI-like shape the client expects
    if (upstream.ok && data.content) {
      const text = data.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
      return res.status(200).json({
        choices: [{ message: { role: 'assistant', content: text } }],
      });
    }

    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[api/chat]', err);
    return res.status(500).json({ error: 'Upstream request failed' });
  }
}
