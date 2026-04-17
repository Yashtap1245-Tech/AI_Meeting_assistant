# AI Assistant Web Client

## Overview

This is a client-only React single page application built with Vite and TypeScript. It provides live transcription, AI suggestions, chat, and JSON session export using a user-provided Groq API key stored in browser local storage.

## Project Structure

- `src/App.tsx` coordinates application state and the three-column UI.
- `src/components/` contains UI panels and settings modal components.
- `src/hooks/useAudioRecorder.ts` manages browser microphone recording.
- `src/utils/groq.ts` contains client-side Groq API calls.
- `vite.config.ts` configures Vite for Replit preview on `0.0.0.0:5000` with proxy host support.
- The app header displays the short Git commit hash embedded at build time via Vite.

## Runtime

- Development command: `npm run dev`
- Frontend port: `5000`
- No backend service or database is used.
- Production deployment builds with `npm run build` and runs `npm start`, which serves the generated `dist` folder with `serve` on port `5000`.