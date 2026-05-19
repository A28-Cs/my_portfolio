import { randomUUID } from 'crypto';

/**
 * Vercel Serverless Function — AI chat proxy.
 *
 * Priority order (first key found wins):
 *   1. AGENTROUTER_API_KEY → AgentRouter (free Claude access via claude-cli headers)
 *   2. ANTHROPIC_API_KEY   → Anthropic API directly
 *
 * Set in Vercel dashboard → Settings → Environment Variables.
 */

const MODEL = 'claude-haiku-4-5-20251001';

// Stable per server instance — AgentRouter rate-limits when session ID changes every request
const SESSION_ID = randomUUID();

/** Headers that make AgentRouter accept the request (matches what Claude Code sends) */
function agentRouterHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
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
    'x-claude-code-session-id': SESSION_ID,
  };
}

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

  const agentRouterKey = process.env.AGENTROUTER_API_KEY;
  const anthropicKey   = process.env.ANTHROPIC_API_KEY;

  if (!agentRouterKey && !anthropicKey) {
    return res.status(500).json({
      error: 'No API key configured. Set AGENTROUTER_API_KEY or ANTHROPIC_API_KEY.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body.messages || [];
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const useAgentRouter = !!agentRouterKey;
    const url = useAgentRouter
      ? 'https://agentrouter.org/v1/messages?beta=true'
      : 'https://api.anthropic.com/v1/messages';
    const headers = useAgentRouter
      ? agentRouterHeaders(agentRouterKey)
      : { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' };

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

    const data = await upstream.json();

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
