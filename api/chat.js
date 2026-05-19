/**
 * Vercel Serverless Function — AI chat proxy.
 *
 * Uses the standard Anthropic Messages API format.
 * Compatible with both direct Anthropic and AgentRouter:
 *   - ANTHROPIC_API_KEY   → your API key (required)
 *   - ANTHROPIC_BASE_URL  → base URL (defaults to https://api.anthropic.com)
 *
 * For AgentRouter, set:
 *   ANTHROPIC_BASE_URL=https://agentrouter.org
 *   ANTHROPIC_API_KEY=sk-xxx  (your AgentRouter token)
 *
 * Set in Vercel dashboard → Settings → Environment Variables.
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

  const apiKey  = process.env.ANTHROPIC_API_KEY;
  const baseUrl = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');

  if (!apiKey) {
    return res.status(500).json({
      error: 'No API key configured. Set ANTHROPIC_API_KEY in environment variables.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body.messages || [];
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const url = `${baseUrl}/v1/messages`;
    const isAgentRouter = baseUrl.includes('agentrouter.org');
    
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    
    if (isAgentRouter) {
      Object.assign(headers, {
        'anthropic-beta': 'claude-code-20250219,interleaved-thinking-2025-05-14',
        'anthropic-dangerous-direct-browser-access': 'true',
        'user-agent': 'claude-cli/2.1.143 (external, claude-desktop, agent-sdk/0.2.138)',
        'x-app': 'cli',
        'x-stainless-arch': 'x64',
        'x-stainless-lang': 'js',
        'x-stainless-os': 'Linux',
        'x-stainless-package-version': '0.94.0',
        'x-stainless-runtime': 'node',
        'x-stainless-runtime-version': 'v22.0.0',
      });
    }

    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        system: systemMsg,
        messages: userMessages,
        max_tokens: Math.min(body.max_tokens || 512, 1024),
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      }),
    });

    const rawData = await upstream.text();
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      // If it's not JSON, it might be a plain text error from AgentRouter (e.g. 'Unauthorized')
      return res.status(upstream.status).json({ error: rawData || `HTTP ${upstream.status}` });
    }

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
    return res.status(500).json({ error: `Upstream request failed: ${err.message}` });
  }
}

