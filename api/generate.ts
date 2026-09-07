// Vercel Function (Node.js runtime, Web-standard Request/Response signature).
// Holds all vendor API keys server-side; the browser bundle contains none.
// In local dev, the same logic is served by the Vite middleware in vite.config.ts.

import { handleGenerate, GenerateRequest } from '../server/generateCore';

export const maxDuration = 120;

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'error_process' });

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return json(400, { error: 'error_process' });
  }

  try {
    const result = await handleGenerate(body, request.signal);
    return json(200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error_process';
    if (/cancelled|canceled|aborted/i.test(message)) return json(499, { error: 'error_cancelled' });
    const status = message === 'error_no_provider' ? 503 : 502;
    return json(status, { error: message });
  }
}
