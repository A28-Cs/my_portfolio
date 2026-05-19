/**
 * Vercel Serverless Function — AI chat proxy using Google Gemini.
 *
 * Environment variables (set in Vercel dashboard → Settings → Environment Variables):
 *   - GEMINI_API_KEY → your Google AI Studio API key (required)
 *     Get one free at: https://aistudio.google.com/apikey
 *
 * Accepts the same request format as the frontend sends, translates to Gemini format,
 * and returns the response in the same shape the frontend expects.
 */

const MODEL = 'gemini-2.0-flash';

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

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'No API key configured. Set GEMINI_API_KEY in environment variables.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body.messages || [];

    // Extract system instruction
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';

    // Convert chat messages to Gemini format
    // Gemini uses "user" and "model" roles (not "assistant")
    const geminiContents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: geminiContents,
      generationConfig: {
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
        maxOutputTokens: Math.min(body.max_tokens || 512, 2048),
      },
    };

    // Add system instruction if present
    if (systemMsg) {
      geminiBody.systemInstruction = {
        parts: [{ text: systemMsg }],
      };
    }

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
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

    if (upstream.ok && data.candidates && data.candidates.length > 0) {
      const text = data.candidates[0].content?.parts
        ?.map(p => p.text)
        .join('\n') || '';

      return res.status(200).json({
        choices: [{ message: { role: 'assistant', content: text } }],
      });
    }

    // Error from Gemini API
    const errMsg = data.error?.message || JSON.stringify(data);
    return res.status(upstream.status || 500).json({ error: errMsg });
  } catch (err) {
    console.error('[api/chat]', err);
    return res.status(500).json({ error: `Upstream request failed: ${err.message}` });
  }
}
