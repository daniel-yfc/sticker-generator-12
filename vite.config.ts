import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Server-side env keys. These are read from .env (local dev) or from the
// hosting platform's env vars (Vercel). They are NEVER inlined into the
// browser bundle — the client talks only to /api/*.
const SERVER_ENV_KEYS = [
  'AI_PROVIDER',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'VENICE_API_KEY',
  'VENICE_MODEL',
  'GENSPAKE_API_KEY',
  'GENSPAKE_MODEL',
  'NVIDIA_NIM_API_KEY',
  'NVIDIA_NIM_BASE_URL',
  'NVIDIA_NIM_MODEL',
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
  'HUGGINGFACE_API_KEY',
  'HUGGINGFACE_MODEL',
];

const readJsonBody = (req: IncomingMessage): Promise<any> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk as Buffer));
    req.on('end', () => {
      try {
        resolve(chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
};

// Dev-only shim serving the same handlers as the Vercel functions in api/.
// Modules are loaded via ssrLoadModule so TypeScript and env hot-reads work.
function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-serverless-shim',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'error_process' });
        try {
          const body = await readJsonBody(req);
          const { handleGenerate } = (await server.ssrLoadModule('/server/generateCore.ts')) as any;
          const result = await handleGenerate(body);
          sendJson(res, 200, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'error_process';
          const status = message === 'error_no_provider' ? 503 : 502;
          sendJson(res, status, { error: message });
        }
      });
      server.middlewares.use('/api/config', async (_req, res) => {
        try {
          const { getPublicConfig } = (await server.ssrLoadModule('/server/generateCore.ts')) as any;
          sendJson(res, 200, getPublicConfig());
        } catch {
          sendJson(res, 500, { error: 'error_process' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  for (const key of SERVER_ENV_KEYS) {
    if (fileEnv[key] && !process.env[key]) {
      process.env[key] = fileEnv[key];
    }
  }

  return {
    plugins: [react(), devApiPlugin()],
  };
});
