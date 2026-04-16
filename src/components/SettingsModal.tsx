import React, { useState } from 'react';
import type { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [modelId, setModelId] = useState(settings.modelId || 'llama-3.1-70b-versatile');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ apiKey, modelId });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="panel" style={{ width: 400, maxWidth: '90%' }}>
        <header className="panel-header" style={{ color: 'white', fontSize: 14 }}>
          Settings
        </header>
        <div className="panel-content">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Groq API Key</label>
              <input 
                className="chat-input" 
                style={{ width: '100%' }}
                type="password"
                required
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="gsk_..."
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Model Selection</label>
              <input 
                className="chat-input" 
                style={{ width: '100%' }}
                type="text"
                required
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                placeholder="llama-3.1-70b-versatile"
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Ensure your Groq key has access to the specified model (e.g. llama-3.1-70b-versatile).
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              {settings.apiKey && (
                <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
              )}
              <button type="submit" className="btn-primary">Save Settings</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
