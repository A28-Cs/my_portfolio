import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Vite plugin: emulate Vercel's /api/chat function during `npm run dev`.
 *  Uses GROQ_API_KEY to call Groq API (OpenAI-compatible).
 *  Get a free key at: https://console.groq.com/keys
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

        const apiKey = env.GROQ_API_KEY;

        if (!apiKey) {
          res.statusCode = 500;
          return res.end(JSON.stringify({
            error: 'No API key configured. Set GROQ_API_KEY in .env',
          }));
        }

        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(raw || '{}');
            const messages = body.messages || [];

            const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
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
              res.statusCode = upstream.status;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: rawData || `HTTP ${upstream.status}` }));
            }

            if (upstream.ok) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(data));
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
