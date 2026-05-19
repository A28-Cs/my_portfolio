import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Vite plugin: emulate Vercel's /api/chat function during `npm run dev`.
 *  Uses GEMINI_API_KEY to call Google Gemini API.
 *  Get a free key at: https://aistudio.google.com/apikey
 */
function chatProxyPlugin(env) {
  return {
    name: 'chat-proxy-dev',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          res.statusCode = 500;
          return res.end(JSON.stringify({
            error: 'No API key configured. Set GEMINI_API_KEY in .env',
          }));
        }

        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(raw || '{}');
            const messages = body.messages || [];
            const systemMsg = messages.find(m => m.role === 'system')?.content || '';

            // Convert to Gemini format
            const geminiContents = messages
              .filter(m => m.role !== 'system')
              .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              }));

            const model = 'gemini-2.0-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const geminiBody = {
              contents: geminiContents,
              generationConfig: {
                temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
                maxOutputTokens: Math.min(body.max_tokens || 512, 2048),
              },
            };

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
              res.statusCode = upstream.status;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: rawData || `HTTP ${upstream.status}` }));
            }

            if (upstream.ok && data.candidates && data.candidates.length > 0) {
              const text = data.candidates[0].content?.parts
                ?.map(p => p.text)
                .join('\n') || '';
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                choices: [{ message: { role: 'assistant', content: text } }],
              }));
            }

            const errMsg = data.error?.message || JSON.stringify(data);
            res.statusCode = upstream.status || 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: errMsg }));
          } catch (err) {
            console.error('[chat-proxy-dev]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: `Upstream request failed: ${err.message}` }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [chatProxyPlugin(env)],
    build: {
      rollupOptions: {
        input: {
          home:       resolve(__dirname, 'index.html'),
          about:      resolve(__dirname, 'about.html'),
          projects:   resolve(__dirname, 'projects.html'),
          services:   resolve(__dirname, 'services.html'),
          experience: resolve(__dirname, 'experience.html'),
          contact:    resolve(__dirname, 'contact.html'),
          adminLogin: resolve(__dirname, 'admin/index.html'),
          adminDash:  resolve(__dirname, 'dashboard.html'),
        }
      }
    },
    server: {
      port: 3000,
      open: true
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/scripts'),
        '@styles': resolve(__dirname, 'src/styles')
      }
    }
  };
});
