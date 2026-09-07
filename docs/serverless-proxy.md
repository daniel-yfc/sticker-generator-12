# Serverless Proxy Architecture

## Why

Previously, `vite.config.ts` inlined every vendor API key into the browser
bundle via `define`. Anyone with the built JavaScript had the keys, and the
Header's provider selector was cosmetic — the actual provider was fixed at
build time by `AI_PROVIDER`.

All vendor calls now go through a server-side proxy. The browser bundle
contains **no API keys**, and the provider/model chosen in the Header is sent
with each request and honored as the primary provider (with the remaining
keyed providers as fallbacks).

## Layout

```
api/generate.ts        Vercel Function — POST /api/generate
api/config.ts          Vercel Function — GET /api/config (providers with keys + models)
server/generateCore.ts Shared core: validation, provider chain, fallback, abort
services/stickerService.ts   Client facade — fetch('/api/generate'), same public API as before
vite.config.ts         Dev-only middleware serving the same /api/* handlers
```

Request contract for `POST /api/generate`:

```jsonc
{
  "mode": "generate" | "variation" | "set",
  "provider": "venice",            // optional — primary provider; defaults to AI_PROVIDER
  "model": "venice-v2",            // optional — defaults to provider's first configured model
  "imageBase64": "data:image/png;base64,...",        // generate / set
  "previousStickerBase64": "data:image/png;base64,...", // variation
  "style": { "id": 1, "prompt": "...", "previewColor": "..." },
  "variationPrompt": "...",        // generate (optional)
  "variationOptions": { "strength": "low|medium|high", "customPrompt": "...", "sourceImageBase64": "..." },
  "variations": ["...", "..."]     // set
}
```

Response: `{ "images": ["data:image/png;base64,..."], "provider": "...", "model": "..." }`
Errors: non-200 with `{ "error": "<i18n key>" }` (`error_no_provider`,
`error_safety`, `error_timeout`, `error_process`, ...). `503` means no
provider has a server-side key.

## Environment setup

Local dev:

1. `cp .env.example .env` and fill in real keys.
2. `npm run dev` — the Vite middleware loads `.env` into the dev server
   process only (never into the client bundle) and serves `/api/*`.

Vercel deployment:

1. Project Settings → Environment Variables: add the same variables
   (`GEMINI_API_KEY`, `VENICE_API_KEY`, ... — see `.env.example`).
2. Push; Vercel auto-detects `api/*.ts` as functions. No `vercel.json` needed.
3. Confirm the deployed build log shows no `define`-inlined secrets; the
   client chunk should no longer contain `@google/genai`.

Make sure `.env` is listed in `.gitignore` before committing real keys.

## Caveats and limits

- **Request body size**: Vercel Functions cap request bodies at about
  **4.5 MB**. A base64 source image inflates ~33%, so uploads near the
  10 MB client-side limit will be rejected by the platform before the
  handler runs. If you hit this, downscale the processed image before
  sending, or move uploads to direct blob storage.
- **Execution time**: `api/generate.ts` sets `maxDuration = 120` because a
  sticker *set* is 4 sequential-ish vendor calls behind one request. The
  Hobby plan clamps function duration (60s at time of writing); long sets
  may need a plan with higher limits.
- **Vendor timeouts** are unchanged (60s per provider call); the fallback
  chain tries each keyed provider once, in order.
- **Abort**: client aborts propagate via `request.signal` on Vercel and via
  the dev middleware; in-flight vendor calls may still complete server-side
  (you are billed for those).

## Tests

`services/stickerService.test.ts` covers the client contract (URL, body
shape, provider/model passthrough, error-key mapping, abort behavior,
`/api/config` loading). Server-side provider behavior remains covered by
the existing `services/providers/*` tests, which exercise the same
registry/providers the proxy uses.
