import { useState, useCallback } from 'react';
import { Settings, Download } from 'lucide-react';
import TranscriptColumn from './components/TranscriptColumn';
import SuggestionsColumn from './components/SuggestionsColumn';
import ChatColumn from './components/ChatColumn';
import SettingsModal from './components/SettingsModal';
import type { AppSettings, ChatMessage, SuggestionBatch, TranscriptSegment } from './types';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { transcribeAudio } from './utils/groq';

const appCommit = __APP_COMMIT__;

function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ai-assistant-settings');
    return saved ? JSON.parse(saved) : { apiKey: '', modelId: 'openai/gpt-oss-120b' };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(!settings.apiKey);

  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [suggestionBatches, setSuggestionBatches] = useState<SuggestionBatch[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [forceFetchSuggestions, setForceFetchSuggestions] = useState(false);

  const handleChunkReady = useCallback(async (blob: Blob) => {
    if (!settings.apiKey) return;
    try {
      const text = await transcribeAudio(blob, settings.apiKey);
      if (text) {
        setTranscript(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text
          }
        ]);
        // Trigger a fetch after successful transcript upload
        setForceFetchSuggestions(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, [settings.apiKey]);

  const { isRecording, toggleRecording, requestData } = useAudioRecorder(handleChunkReady);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ai-assistant-settings', JSON.stringify(newSettings));
    setIsSettingsOpen(false);
  };

  const handleSuggestionClick = (content: string) => {
    // Add to chat and trigger response
    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content };
    setChatHistory(prev => [...prev, newMessage]);
    // It will be picked up by ChatColumn component logic
  };

  const exportData = () => {
    const sessionData = {
      transcript,
      suggestionBatches,
      chatHistory
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-assistant-session-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="app-header">
        <div>
          <div className="app-title">AI Assistant — Live Suggestions Web App (Reference Mockup)</div>
          <div className="app-version">Version {appCommit}</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="app-subtitle">
            3-column layout &bull; Transcript &bull; Live Suggestions &bull; Chat
          </div>
          <button className="btn-outline" onClick={exportData} title="Export Session">
            <Download size={14} /> Export
          </button>
          <button className="btn-outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={14} /> Settings
          </button>
        </div>
      </header>

      <main className="main-layout">
        <TranscriptColumn
          transcript={transcript}
          isRecording={isRecording}
          toggleRecording={toggleRecording}
        />

        <SuggestionsColumn
          settings={settings}
          transcript={transcript}
          suggestionBatches={suggestionBatches}
          setSuggestionBatches={setSuggestionBatches}
          onSuggestionClick={handleSuggestionClick}
          requestData={requestData}
          forceFetchSuggestions={forceFetchSuggestions}
          setForceFetchSuggestions={setForceFetchSuggestions}
          isRecording={isRecording}
        />

        <ChatColumn
          settings={settings}
          transcript={transcript}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      </main>

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => settings.apiKey && setIsSettingsOpen(false)}
        />
      )}
    </>
  );
}

export default App;
