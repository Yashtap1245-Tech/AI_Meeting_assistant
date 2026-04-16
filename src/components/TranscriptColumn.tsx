import { useEffect, useRef } from 'react';
import type { TranscriptSegment } from '../types';

interface Props {
  transcript: TranscriptSegment[];
  isRecording: boolean;
  toggleRecording: () => void;
}

export default function TranscriptColumn({ transcript, isRecording, toggleRecording }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <section className="panel">
      <header className="panel-header">
        <span>1. MIC &amp; TRANSCRIPT</span>
        <span>{isRecording ? 'RECORDING' : 'IDLE'}</span>
      </header>
      
      <div className="mic-status" onClick={toggleRecording}>
        <div className={`mic-button ${isRecording ? 'recording' : ''}`}>
          <div style={{ width: 6, height: 6, backgroundColor: '#000', borderRadius: '50%' }}></div>
        </div>
        <span>{isRecording ? 'Recording... Click to stop.' : 'Stopped. Click to resume.'}</span>
      </div>

      <div className="panel-content" ref={scrollRef}>
        {transcript.map((t) => (
          <div key={t.id} className="transcript-line">
            <span className="time">{t.timestamp}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
