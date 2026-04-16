# TwinMind Web Client

A full-stack, client-only React Single Page Application (SPA) providing real-time AI transcription and context-aware suggestions utilizing the Groq API.

## Core Features

- **Live Transcription**: Hooks natively into HTML5 `MediaRecorder` API to rapidly slice microphone input and push chunks into Groq's high-speed Whisper Large V3 offering, ensuring rapid edge-based local transcript sync. Audio chunks correctly structure WebM containers avoiding edge-case frame dropping.
- **Contextual Suggestions**: A background daemon actively polls the transcript history, automatically prompting LLM models to generate context-locked actionable tasks (Q&A vectors, Fact Checks) roughly every ~30 seconds.
- **Real-time SSE Chat**: Enables instantaneous, sub-second latency streaming inside the built-in chat column using native fetch `TextDecoder` streaming integration to respond to arbitrary dialogue questions dynamically without breaking out of the conversational context.
- **Session Exportity**: Provides a unified `.json` packaging algorithm that compresses the current session's Chat, Suggestions, and Transcripts into a downloadable disk file instantly.

## Architecture & Code Quality Highlights
- **100% Serverless**: No backend infrastructure. App operates completely out of the static React client with direct secure outbound calls to the Groq inference plane via user-assigned API keys stored locally.
- **Performance Driven Boundaries**: Completely vanilla CSS UI (zero heavy CSS dependencies), pure functional hooks decoupling standard business logic (`useAudioRecorder`), and aggressive state-sharing via top-level functional props (`App.tsx` manager).
- **Graceful Error Management**: Opaque LLM JSON hallucinations or nested endpoint connection faults are cleanly trapped and rendered directly to warning banners in the UI instead of collapsing underlying app execution graphs.

## Execution

1. Build using standard package manager tools: `npm install && npm run dev`.
2. Connect a local Groq API key using the header Settings button.
3. Validate connection using the Mic activation node to begin live processing.
