# Sticker Maker Pro

A client-side React + TypeScript + Vite app that turns a portrait photo into a die-cut style sticker using AI. Supports multiple AI vendors (Gemini, Venice.AI, Genspake, NVIDIA NIM, OpenRouter, Hugging Face Inference) via a pluggable provider layer.

> **Status:** development-ready prototype. Not yet production-ready. See "Security model" below.

---

## Features

- Upload a portrait (PNG / JPEG / WebP, max 10 MB), crop and rotate with a built-in editor.
- Choose from a catalog of art styles.
- Generate a single sticker, a 4-piece sticker set, or a character-consistent variation of a previously generated sticker.
- Switch AI providers via environment config (no code changes).
- Browse past generations in a local history (per-browser, `localStorage`).
- Three UI languages: 繁體中文, English, 日本語.

## Quick start

### Prerequisites

- Node.js 20+ (see `.github/workflows/ci.yml`).
- An API key for your chosen provider. See table below.

### Install and run

```bash
npm install
cp .env.example .env
# Edit .env and set AI_PROVIDER + your provider's API key
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
npm run lint       # eslint .; runs in CI
npm run test       # vitest run; runs in CI
```

---

## Supported AI providers

| Provider      | `AI_PROVIDER` value | Env var(s) to set                       | Notes                                      |
|---------------|---------------------|-----------------------------------------|--------------------------------------------|
| Google Gemini | `gemini` (default)  | `GEMINI_API_KEY`                        | Default; best for sticker transformations. |
| Venice.AI     | `venice`            | `VENICE_API_KEY`, `VENICE_MODEL`        | OpenAI-compatible endpoint.                |
| Genspake      | `genspake`          | `GENSPAKE_API_KEY`, `GENSPAKE_MODEL`    | OpenAI-compatible endpoint.                |
| NVIDIA NIM    | `nvidia-nim`        | `NVIDIA_NIM_API_KEY`, `NVIDIA_NIM_BASE_URL`, `NVIDIA_NIM_MODEL` | Supports image edits; use SD3.5 or similar. |
| OpenRouter    | `openrouter`        | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`| Aggregator; pick any image model.          |
| Hugging Face  | `huggingface`       | `HUGGINGFACE_API_KEY`, `HUGGINGFACE_MODEL` | Inference API for SD/other image models. |

Set `AI_PROVIDER` in `.env` to switch. All other vendor keys are optional unless you select that provider.

---

## Security model — read this first

This project is a **local / private prototype**. API keys are read at build time and **inlined into the browser bundle**. That means:

- Any key placed in `.env` becomes **public** to every user of the deployed app.
- There is no server, no rate limiting, no spend cap, and no abuse protection.

**Do not** deploy the production build to a public URL with a real, unrestricted key.

If you want to ship this beyond trusted local use, you must:

1. Move AI calls behind a server-side proxy or serverless function.
2. Keep real keys in server-side secrets only.
3. Add authentication, rate limiting, quota/budget alerts, and origin restrictions on the proxy.

`.env.example` includes a longer version of this warning at the top.

---

## Project structure

```
.
├── App.tsx                   # Orchestration / view state
├── index.tsx                 # React root + ErrorBoundary
├── types.ts                  # Shared domain types
├── constants/
│   ├── styles.ts             # Style catalog + sample gallery
│   └── translations.ts       # i18n dictionaries (zh-TW, en, ja)
├── services/
│   ├── stickerService.ts     # Facade (current public API)
│   └── providers/
│       ├── types.ts          # StickerProvider interface
│       ├── geminiProvider.ts # Gemini adapter
│       ├── openaiCompatibleProvider.ts # Vendor-agnostic OpenAI-like adapter
│       └── registry.ts       # Env-driven factory
├── components/               # UI components
├── images/                   # Static illustration assets
├── review_notes/             # External code reviews (Perplexity)
├── .env.example
├── vite.config.ts            # Reads env vars, inlines them into the bundle
└── tsconfig.json
```

## Configuration

All configuration is via `.env`. See `.env.example` for the full list and the security warning.

| Variable | Required | Purpose |
|---|---|---|
| `AI_PROVIDER` | no (default `gemini`) | Selects active provider: `gemini`, `venice`, `genspake`, `nvidia-nim`, `openrouter`, `huggingface`. |
| `GEMINI_API_KEY` | yes if `AI_PROVIDER=gemini` | Gemini API key, inlined at build time. |
| `VENICE_API_KEY`, `VENICE_MODEL` | yes if `AI_PROVIDER=venice` | Venice.AI credentials + model. |
| `GENSPAKE_API_KEY`, `GENSPAKE_MODEL` | yes if `AI_PROVIDER=genspake` | Genspake credentials + model. |
| `NVIDIA_NIM_API_KEY`, `NVIDIA_NIM_BASE_URL`, `NVIDIA_NIM_MODEL` | yes if `AI_PROVIDER=nvidia-nim` | NVIDIA NIM credentials + endpoint + model. |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | yes if `AI_PROVIDER=openrouter` | OpenRouter credentials + model. |
| `HUGGINGFACE_API_KEY`, `HUGGINGFACE_MODEL` | yes if `AI_PROVIDER=huggingface` | Hugging Face Inference credentials + model. |
| `GEMINI_API_BASE_URL` | no | Reserved; not yet wired into `vite.config.ts`. |
| `GEMINI_DEBUG` | no | Reserved; not yet wired in. |

## Supported inputs

- **File types:** PNG, JPEG, WebP (allowlist; magic-byte check is performed before the API call).
- **File size:** up to 10 MB.
- **No animated images** (GIF / animated WebP) are supported.

Uploaded images stay in your browser — they are sent directly to the selected AI provider for generation and are not stored on any server.

## Known limitations

- `App.tsx` is a coordinator component; a future refactor can extract domain workflow logic into a custom hook or reducer.
- `constants.ts` is large and a candidate for splitting into modular files.
- API keys are bundled into the client for local prototyping; see "Security model".

## Roadmap

Priorities based on external architecture and security reviews:

- **P0 (Completed):** env-var consistency, error boundary, abort + cancel, retry classification, input validation, `.gitignore` secret exclusion, README, CI gate.
- **P1 (Completed/In Progress):** Vitest + React Testing Library (14 unit/component tests), ESLint flat config, full CI gate (`lint` + `typecheck` + `test` + `build`), history retention limit (50 max) + clear all, accessibility (a11y) improvements, component modularization.
- **P2:** observability (without sensitive content), CSP / deployment hardening, Dependabot, governance (LICENSE, SECURITY, CONTRIBUTING), low-memory mobile performance, end-to-end tests.

## Privacy and AI-generated content

- Generated stickers are produced by the selected AI provider and may be subject to safety filters. If a generation is blocked, the UI surfaces a localized "safety" message and does not retry.
- This app is for personal, non-commercial prototyping. Be mindful of consent when uploading photos of other people.

## License

MIT License — see `LICENSE` file.
