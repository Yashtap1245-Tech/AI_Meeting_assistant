const GROQ_API_URL = 'https://api.groq.com/openai/v1';

export async function transcribeAudio(blob: Blob, apiKey: string): Promise<string> {
  const formData = new FormData();
  // Groq API expects an audio file
  const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
  formData.append('file', file);
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'text');

  const res = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      // Do not set Content-Type, so browser sets the correct boundary
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to transcribe audio.');
  }
  
  let text = await res.text();
  text = text.trim();
  
  // Filter common whisper hallucinations for silence when using small chunks
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes('amara.org') || 
    lowerText === 'thank you.' || 
    lowerText === 'thanks for watching!' || 
    lowerText === 'thanks for watching.' ||
    lowerText === 'you'
  ) {
    return "";
  }

  return text;
}

export async function generateSuggestions(transcript: string, apiKey: string, modelId: string) {
  const prompt = `You are an AI assistant analyzing a transcript.
Generate EXACTLY 3 suggestions for the user.
Types must be exactly one of: ANSWER, QUESTION TO ASK, TALKING POINT, FACT CHECK.

STRICT FORMATTING RULES:
1. The "content" field MUST be a SINGLE, CONCISE SENTENCE in plain English.
2. ABSOLUTELY NO MARKDOWN. Do not use *, #, -, |, or any formatting.
3. Keep it under 15 words.

Read the transcript below and output ONLY valid JSON matching this schema:
{
  "suggestions": [
    {
      "type": "ANSWER",
      "content": "Plain text short sentence."
    }
  ]
}

Transcript:
"""
${transcript}
"""`;

  const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId || 'llama-3.1-70b-versatile',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Failed to generate suggestions');
  }

  const data = await res.json();
  try {
    let content = data.choices[0].message.content;
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(content);
    
    // Fallback sanitizer to mathematically guarantee no large text or markdown gets through to the UI
    const sanitized = (parsed.suggestions || []).map((s: any) => ({
      type: s.type,
      content: s.content
        .replace(/[*#|`_~]/g, '') // Strip markdown formatting chars
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .substring(0, 100)
        .trim() + (s.content.length > 100 ? '...' : '') // Hard cap at 100 chars
    }));
    
    return sanitized;
  } catch (e) {
    console.error("Failed to parse suggestions JSON", e);
    return [];
  }
}

export async function streamChatMessage(
  messages: {role: string, content: string}[], 
  transcriptContext: string, 
  apiKey: string, 
  modelId: string,
  onChunk: (text: string) => void
) {
  const systemPrompt = `You are a highly capable, intelligent assistant analyzing a live conversation transcript.
Your objective is to provide deeply relevant and detailed answers directly addressing the user's questions, using the transcript context.

STRICT FORMATTING RULES:
1. Output ONLY plain, readable English text.
2. ABSOLUTELY NO MARKDOWN formatting (do not use bold **, bullet points, headers, or tables).
3. Your answer must be detailed and comprehensive, yet completely relevant to what was specifically asked.

Transcript Context:
"""
${transcriptContext}
"""
`;

  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId || 'llama-3.1-70b-versatile',
      messages: messagesPayload,
      temperature: 0.5,
      stream: true
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Failed to send chat message');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('ReadableStream not supported by browser.');

  const decoder = new TextDecoder('utf-8');
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const dataObj = JSON.parse(line.replace('data: ', ''));
            const content = dataObj.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch (e) {
            // Unparseable streaming fragment, safe to ignore
          }
        }
      }
    }
  }
}
