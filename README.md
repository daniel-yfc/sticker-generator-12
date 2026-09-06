# Sticker Maker Pro

A client-side React + TypeScript + Vite app that turns a portrait photo into a die-cut style sticker using Google's Gemini image model. Supports single stickers, sticker sets, and character-consistent variations.

> **Status: development-ready prototype.** Not yet production-ready. See "Security model" below.

---

## Features

- Upload a portrait (PNG / JPEG / WebP, max 10 MB), crop and rotate with a built-in editor.
- Choose from a catalog of art styles.
- Generate a single sticker, a 4-piece sticker set, or a character-consistent variation of a previously generated sticker.
- Browse past generations in a local history (per-browser, `localStorage`).
- Three UI languages: 繁體中文, English, 日本語.

## Quick start

### Prerequisites

- Node.js 20+ (see `.github/workflows/ci.yml`).
- A Gemini API key. Create one at <https://makersuite.google.com/app/apikey>. Use a **restricted, low-quota** key — see "Security model" below.

### Install and run

```bash
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY to your key
npm run dev
```

The dev server listens on <http://localhost:3000>.

### Build and preview

```bash
npm run build      # production build to dist/
npm run preview    # serve dist/ locally
```

### Other scripts

```bash
npm run typecheck  # tsc --noEmit; runs in CI
```

---

## Security model — read this first

This project is a **local / private prototype**. The Gemini API key is read by `vite.config.ts` and **inlined into the browser bundle at build time**. That means:

- Any value placed in `.env` becomes **public** to every user of the deployed app.
- There is no server, no rate limiting, no spend cap, and no abuse protection.

**Do not** deploy the production build to a public URL with a real, unrestricted key.

If you want to ship this beyond trusted local use, you must:

1. Move the Gemini call behind a server-side proxy or serverless function.
2. Keep the real key in server-side secrets only.
3. Add authentication, rate limiting, quota/budget alerts, and origin restrictions on the proxy.

`.env.example` includes a longer version of this warning at the top.

---

## Project structure

```
.
├── App.tsx                   # Orchestration / view state
├── index.tsx                 # React root + ErrorBoundary
├── types.ts                  # Shared domain types
├── constants.ts              # Style catalog + i18n strings
├── services/
│   └── geminiService.ts      # Gemini API adapter
├── components/
│   ├── Header.tsx
│   ├── FileUpload.tsx        # Trust boundary: validates MIME / size / magic bytes
│   ├── ImageEditor.tsx       # Crop / rotate / zoom
│   ├── StyleSelector.tsx
│   ├── ProcessingView.tsx    # Loading state + cancel button
│   ├── ResultDisplay.tsx     # Single / variation result
│   ├── StickerSetView.tsx    # 4-piece set result
│   ├── StickerHistory.tsx
│   └── Gallery.tsx
├── images/                   # Static illustration assets
├── review_notes/             # External code reviews (Perplexity)
├── .env.example
├── vite.config.ts            # Reads GEMINI_API_KEY, inlines it into the bundle
└── tsconfig.json
```

## Configuration

All configuration is via `.env`. See `.env.example` for the full list and the security warning.

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Gemini API key, inlined at build time. |
| `GEMINI_API_BASE_URL` | no | Reserved; not yet wired into `vite.config.ts`. |
| `GEMINI_DEBUG` | no | Reserved; not yet wired in. |

## Supported inputs

- **File types:** PNG, JPEG, WebP (allowlist; magic-byte check is performed before the API call).
- **File size:** up to 10 MB.
- **No animated images** (GIF / animated WebP) are supported.

Uploaded images stay in your browser — they are sent directly to the Gemini API for generation and are not stored on any server.

## Known limitations

- No automated test suite yet (Vitest/RTL is on the roadmap).
- No ESLint or formatter configured.
- `App.tsx` is a single large orchestrator; a future refactor will extract a reducer or custom hooks.
- `constants.ts` and `components/ResultDisplay.tsx` are large and good candidates for splitting.
- The API key is bundled into the client; see "Security model".

## Roadmap

Priorities from the latest external review (`review_notes/7e82da1c.md`):

- **P0 (in progress / this pass):** env-var consistency, error boundary, abort + cancel, retry classification, input validation, README, CI gate.
- **P1:** Vitest + React Testing Library, ESLint + typecheck in CI, refactor `ResultDisplay.tsx` and `App.tsx`, accessibility audit, history retention policy.
- **P2:** observability (without sensitive content), CSP / deployment hardening, Dependabot, low-memory mobile performance, end-to-end tests.

## Privacy and AI-generated content

- Generated stickers are produced by Gemini and may be subject to Google's safety filters. If a generation is blocked, the UI surfaces a localized "safety" message and does not retry.
- This app is for personal, non-commercial prototyping. Be mindful of consent when uploading photos of other people.

## License

Not yet chosen. Add a `LICENSE` file before any public release.
