import React, { useState, useEffect, useRef } from 'react';
import type { AppSettings, ChatMessage, TranscriptSegment } from '../types';
import { streamChatMessage } from '../utils/groq';

interface Props {
  settings: AppSettings;
  transcript: TranscriptSegment[];
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatColumn({ settings, transcript, chatHistory, setChatHistory }: Props) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook to catch when a suggestion is clicked.
  // The App component adds a message to the history, we must react to the latest user message if it has no response.
  useEffect(() => {
    const fetchResponse = async () => {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg && lastMsg.role === 'user' && !isTyping) {
        setIsTyping(true);
        const assistantId = Date.now().toString();
        // Inject empty assistant message framework instantly
        setChatHistory(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        try {
          const context = transcript.map(t => `[${t.timestamp}] ${t.text}`).join('\n');
          const payload = chatHistory.map(m => ({ role: m.role, content: m.content }));
          
          await streamChatMessage(
            payload,
            context,
            settings.apiKey,
            settings.modelId,
            (chunk) => {
              setChatHistory(prev => 
                prev.map(msg => msg.id === assistantId ? { ...msg, content: msg.content + chunk } : msg)
              );
            }
          );
        } catch (err: any) {
          console.error(err);
          setChatHistory(prev => 
            prev.map(msg => msg.id === assistantId ? { ...msg, content: msg.content + "\n\n[Error: " + err.message + "]" } : msg)
          );
        } finally {
          setIsTyping(false);
        }
      }
    };

    fetchResponse();
  }, [chatHistory, transcript, settings, isTyping, setChatHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', content: inputText.trim() }]);
    setInputText('');
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <span>3. CHAT (DETAILED ANSWERS)</span>
        <span>SESSION ONLY</span>
      </header>
      
      <div className="panel-content" ref={scrollRef}>
        {chatHistory.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: 14 }}>
            Click a suggestion or type a question below.
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            <div className="label">{msg.role === 'user' ? 'YOU' : 'ASSISTANT'}</div>
            <p>{msg.content}</p>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message assistant">
            <div className="label">ASSISTANT</div>
            <p className="animate-pulse">Assistant is typing...</p>
          </div>
        )}
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="chat-input" 
          placeholder="Ask anything..." 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={!settings.apiKey || isTyping}
        />
        <button type="submit" className="btn-primary" disabled={!settings.apiKey || isTyping}>
          Send
        </button>
      </form>
    </section>
  );
}
