# AI Assistant Web Client

A full-stack, client-only React Single Page Application (SPA) designed to act as a real-time meeting companion. It provides live AI transcription, automated context-aware suggestions, and instantaneous conversational capabilities.

## Setup

This application is completely serverless and requires no backend database or infrastructure to run. It uses the **Groq API** for ultra-fast transcription and language modeling.

1. **Prerequisites**: Make sure you have Node.js installed.
2. **Installation**:
   ```bash
   npm install
   ```
3. **Local Development**:
   ```bash
   npm run dev
   ```
4. **Configuration**: 
   - Open the application in your browser.
   - Click the **Settings** button in the top right.
   - Provide a valid **Groq API Key** with access to Whisper Large V3 (for audio) and the `openai/gpt-oss-120b` text model. This key is stored securely in your browser's local storage.
5. **Production Deployment**:
   - Because this is a static Vite app, it can be hosted anywhere (Replit, Vercel, GitHub Pages). 
   - Run `npm run build` and publish the generated `dist/` directory directly.

---

## Stack Choices

- **React + TypeScript (via Vite)**: Provides an incredible developer experience (HMR) and highly optimized static builds. Static typing ensures strict adherence when dealing with complex nested JSON payloads returned by language models.
- **Vanilla CSS**: We completely avoided CSS-in-JS libraries and massive utility frameworks to maintain a near-instant zero-runtime styling engine right in `index.css`.
- **Fetch API & TextDecoder**: Instead of relying on heavy third-party OpenAI or Groq SDKs, we opted for the native browser Fetch API for LLM streaming. Utilizing `TextDecoder`, we can parse Server-Sent Events (SSE) manually, keeping the bundle size ultra-light while guaranteeing sub-second Time To First Token (TTFT).
- **Groq Cloud API**: Standard public LLMs are too slow for an application meant to assist you *during* a live conversation. The Groq engine is utilized here strictly because of its unmatched inference speeds, capable of transcription and deep contextual analysis in milliseconds.

---

## Prompt Strategy

Our prompt engineering revolves around isolating different functional vectors to prevent the model from overwhelming the user:

1. **The 30-Second Batch Matrix (Suggestions)**: Every ~30 seconds, a background daemon harvests the trailing slice of the active transcript and hits the LLM in "JSON mode". The system prompt strictly enforces a categorized array structure: `Action`, `Question`, `Talking Point`, and `Fact Check`. This forces the model to synthesize high-level tactical advice instead of just summarizing the text.
2. **Temporal Context Injection**: We process raw transcript chunks through a timestamp sequencer in the format `[HH:MM:SS] The words spoken`. When the user asks the chat column a question, the LLM is given this entire temporal web as system context, ensuring it knows exactly *when* things were said and heavily anchoring its responses to reality (preventing hallucinations).
3. **Graceful Fallbacks**: The code utilizes defensive JSON parsing boundaries. If the AI hallucinates bad syntax in the Suggestion matrix despite prompt guardrails, the client catches the error internally and alerts the UI without crashing the global application state. 

---

## Tradeoffs

- **Serverless Edge vs. Secure Key Storage**: By omitting a backend proxy server, we inherently sacrificed centralized API key control. The obvious benefit is this app can be deployed anywhere globally for $0.00 since there is no server maintenance, but the tradeoff is that users MUST provide their own API key (which is why we securely cache it offline in `localStorage` rather than hardcoding credentials).
- **Browser MediaRecorder vs. WebSockets**: Modern transcription software usually streams raw audio packets over a WebSocket. We accepted minor latency (3 to 5 second polling latency) in favor of the default browser `MediaRecorder` API. This chunking method provides extreme stability, flawlessly handles frame dropping automatically via WebM container encapsulation, and completely circumvents the nightmare of maintaining persistent stateful WebSocket servers.
- **Polled Suggestions vs. Streaming UI Updates**: While the Chat column streams its detailed answers one token at a time for optimal responsiveness, the Live Suggestions column waits to resolve its entire JSON batch every 30 seconds. We explicitly sacrificed streaming speed here because constantly shifting UI elements inside an array creates severe visual fatigue for a user trying to read suggestions during a fast-paced meeting.
