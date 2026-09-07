// Vercel Function: exposes which providers/models are actually configured
// (i.e. have API keys server-side) so the client settings UI only offers
// working choices. No secrets are returned — only provider keys and model IDs.

import { getPublicConfig } from '../server/generateCore';

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') return json(405, { error: 'error_process' });
  try {
    return json(200, getPublicConfig());
  } catch {
    return json(500, { error: 'error_process' });
  }
}
