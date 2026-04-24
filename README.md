<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1bGYC71IWFJ1ZOPeFHGpZRGNF23oRY1io

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set server-side keys in `.env.local`:
   - `GEMINI_API_KEY=...`
   - `SILICONFLOW_API_KEY=...` (required for TTS)
3. Run the app:
   `npm run dev`

## Security notes

- The frontend now calls internal `/api/ai/*` routes.
- Vendor keys stay on the server (Vite dev middleware) and are not injected into client bundles.
