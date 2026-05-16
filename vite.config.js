import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Vite plugin: emulate Vercel's /api/chat function during `npm run dev`.
 *  Mirrors the logic in api/chat.js — supports either ANTHROPIC_API_KEY
 *  (direct Anthropic API, recommended) or AGENTROUTER_API_KEY (CLI-only).
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

        const anthropicKey   = env.ANTHROPIC_API_KEY;
        const agentRouterKey = env.AGENTROUTER_API_KEY;
        if (!anthropicKey && !agentRouterKey) {
          res.statusCode = 500;
          return res.end(JSON.stringify({
            error: 'No API key configured. Set ANTHROPIC_API_KEY or AGENTROUTER_API_KEY in .env',
          }));
        }

        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(raw || '{}');
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
              ? {
                  'Content-Type': 'application/json',
                  'x-api-key': agentRouterKey,
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
                  'x-claude-code-session-id': randomUUID(),
                }
              : {
                  'Content-Type': 'application/json',
                  'x-api-key': anthropicKey,
                  'anthropic-version': '2023-06-01',
                };

            const upstream = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
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
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                choices: [{ message: { role: 'assistant', content: text } }],
              }));
            }

            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err) {
            console.error('[chat-proxy-dev]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Upstream request failed' }));
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
