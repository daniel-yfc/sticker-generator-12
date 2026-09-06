# Contributing to Sticker Maker Pro

Thank you for your interest in contributing to Sticker Maker Pro!

## Development Setup

1. **Prerequisites**: Node.js 20+ and npm.
2. **Clone and Install**:
   ```bash
   git clone https://github.com/daniel-yfc/sticker-generator-12.git
   cd sticker-generator-12
   npm install
   ```
3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Set GEMINI_API_KEY with your development API key
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Code Quality Standards

All pull requests must pass the following CI verification checks:

```bash
npm run lint       # ESLint 9 Flat Config (0 errors, 0 warnings)
npm run typecheck  # TypeScript strict type checking (tsc --noEmit)
npm run test       # Vitest unit and component test suites
npm run build      # Production bundle verification
```

## Pull Request Guidelines

- **Atomic commits**: Keep commits focused and provide clear, descriptive commit messages.
- **Test coverage**: Add or update tests in `*.test.ts` / `*.test.tsx` when adding features or modifying critical behavior.
- **Accessibility**: Ensure new UI elements have appropriate `aria-label` attributes, keyboard accessibility, and respect reduced motion preferences.
- **Security**: Never commit actual API keys, credentials, or `.env` files. Ensure `.env*` remains gitignored.
