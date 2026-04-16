import { useState, useEffect, Fragment } from 'react';
import { RefreshCcw } from 'lucide-react';
import type { AppSettings, SuggestionBatch, TranscriptSegment } from '../types';
import { generateSuggestions } from '../utils/groq';

interface Props {
  settings: AppSettings;
  transcript: TranscriptSegment[];
  suggestionBatches: SuggestionBatch[];
  setSuggestionBatches: React.Dispatch<React.SetStateAction<SuggestionBatch[]>>;
  onSuggestionClick: (content: string) => void;
  requestData: () => void;
  forceFetchSuggestions: boolean;
  setForceFetchSuggestions: (val: boolean) => void;
  isRecording: boolean;
}

export default function SuggestionsColumn({ settings, transcript, suggestionBatches, setSuggestionBatches, onSuggestionClick, requestData, forceFetchSuggestions, setForceFetchSuggestions, isRecording }: Props) {
  const [countdown, setCountdown] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSuggestions = async () => {
    if (!settings.apiKey || transcript.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg('');
    try {
      const recentContext = transcript.slice(-20).map(t => `[${t.timestamp}] ${t.text}`).join('\n');
      const suggestions = await generateSuggestions(recentContext, settings.apiKey, settings.modelId);

      if (suggestions && suggestions.length > 0) {
        setSuggestionBatches(prev => [
          {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            suggestions
          },
          ...prev
        ]);
        setCountdown(30);
      } else {
        setErrorMsg('Model returned no valid JSON suggestions.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed generating suggestions.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Watch for forced fetch command from transcript arrival
  useEffect(() => {
    if (forceFetchSuggestions) {
      setForceFetchSuggestions(false);
      fetchSuggestions();
    }
  }, [forceFetchSuggestions]);

  // Request new transcript data every ~30s automatically
  useEffect(() => {
    if (!isRecording) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          requestData(); // Triggers transcript fetch -> triggers suggestion fetch
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording, requestData]);

  const handleManualRefresh = () => {
    if (isGenerating) return;
    setCountdown(30);
    // If not recording, we can't extract new chunks, just refresh on current transcript.
    if (isRecording) {
      requestData();
    } else {
      fetchSuggestions();
    }
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <span>2. LIVE SUGGESTIONS</span>
        <span>{suggestionBatches.length} BATCHES</span>
      </header>

      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)' }}>
        <button className="btn-outline" onClick={handleManualRefresh} disabled={isGenerating}>
          <RefreshCcw size={14} className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Generating...' : 'Reload suggestions'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>auto-refresh in {countdown}s</span>
      </div>

      <div className="panel-content">
        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', borderRadius: 6, fontSize: 13, color: 'var(--text-muted)', lineHeight: '1.6' }}>
          On reload (or auto every ~30s), generate <span style={{ color: 'white', fontWeight: 500 }}>3 fresh suggestions</span> from recent transcript context. New batch appears at the top; older batches push down (faded). Each is a tappable card: a <span style={{ color: 'var(--tag-question)' }}>question to ask</span>, a <span style={{ color: 'var(--tag-talking-point)' }}>talking point</span>, an <span style={{ color: 'var(--tag-answer)' }}>answer</span>, or a <span style={{ color: 'var(--tag-fact-check)' }}>fact check</span>. The preview alone should already be useful.
        </div>

        {errorMsg && (
          <div style={{ padding: 12, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 6, fontSize: 13 }}>
            {errorMsg}
          </div>
        )}

        {suggestionBatches.map((batch, batchIndex) => (
          <Fragment key={batch.id}>
            {batchIndex > 0 && <div className="batch-separator">— BATCH {suggestionBatches.length - batchIndex} · {batch.timestamp} —</div>}
            {batch.suggestions.map((sug, i) => {
              const tagClass = sug.type.toLowerCase().replace(/ /g, '-');
              return (
                <div key={i} className={`suggestion-card ${batchIndex > 0 ? 'old' : ''}`} onClick={() => onSuggestionClick(sug.content)}>
                  <span className={`tag ${tagClass}`}>{sug.type}</span>
                  <div className="suggestion-text">{sug.content}</div>
                </div>
              );
            })}
          </Fragment>
        ))}
        {suggestionBatches.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: 14 }}>
            Start the microphone to generate context. Suggestions will appear here automatically.
          </div>
        )}
      </div>
    </section>
  );
}
