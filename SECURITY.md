# Security Policy

## Reporting a Vulnerability

If you discover a potential security vulnerability in this project, please report it responsibly by opening a private security advisory on GitHub or by contacting the repository maintainers.

Please do not open public issues for suspected security vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x / main | :white_check_mark: |

## Security Model & API Key Hygiene

1. **Client-Side Prototype Limitation**:
   - In its current design, this project is a **client-side React application**.
   - The Gemini API key (`GEMINI_API_KEY`) is inlined into the client bundle at build time by Vite.
   - Any key compiled into the production build should be considered public.
   - **Do not deploy this prototype to a public or shared hosting environment with a production or high-quota API key.**

2. **Public Deployment Requirements**:
   - Before deploying publicly, route all AI generation requests through a backend server or serverless proxy.
   - Store API credentials exclusively in server-side environment secrets.
   - Enforce authentication, rate limiting, origin allowlisting, and budget caps at the proxy boundary.

3. **Input Validation**:
   - The application performs client-side MIME allowlisting, maximum file size enforcement (10 MB), and file signature (magic byte) verification to reduce exposure to malformed or malicious files.
