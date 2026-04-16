export interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
}

export type SuggestionType = 'ANSWER' | 'QUESTION TO ASK' | 'TALKING POINT' | 'FACT CHECK';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  content: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: string;
  suggestions: Suggestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AppSettings {
  apiKey: string;
  modelId: string;
}
