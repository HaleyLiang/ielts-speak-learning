/**
 * Settings - API configuration, model selection, target score, and data management
 */

import { useState } from 'react';
import { Eye, EyeOff, Trash2, Info, ExternalLink, Check } from 'lucide-react';
import useStore from '../stores/useStore';

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast & affordable' },
  { value: 'gpt-4o', label: 'GPT-4o', desc: 'Best quality' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'High performance' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: 'Budget option' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat', desc: 'Alternative' },
];

const SCORE_OPTIONS = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

export default function Settings() {
  const {
    apiKey, setApiKey,
    model, setModel,
    baseUrl, setBaseUrl,
    targetScore, setTargetScore,
  } = useStore();

  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [localUrl, setLocalUrl] = useState(baseUrl);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(localKey);
    setBaseUrl(localUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    if (confirm('This will clear all local settings (API key, preferences). Your question bank data on the server will remain. Continue?')) {
      localStorage.removeItem('ielts-practice-storage');
      window.location.reload();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your AI and practice preferences</p>
      </div>

      {/* API Configuration */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>🔑 API Configuration</div>

        <div className="input-group">
          <label className="input-label">API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={localKey}
              onChange={e => setLocalKey(e.target.value)}
              style={{ paddingRight: 44 }}
              id="api-key-input"
            />
            <button
              className="btn-icon btn-ghost"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="caption" style={{ marginTop: 4 }}>
            🔒 Stored locally in your browser. Never sent to our servers.
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">API Base URL (optional)</label>
          <input
            className="input"
            type="text"
            placeholder="https://api.openai.com/v1 (default)"
            value={localUrl}
            onChange={e => setLocalUrl(e.target.value)}
            id="base-url-input"
          />
          <div className="caption" style={{ marginTop: 4 }}>
            For compatible providers (e.g., DeepSeek, Azure). Leave empty for OpenAI.
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          style={{ width: '100%' }}
          id="save-api-btn"
        >
          {saved ? <><Check size={16} /> Saved!</> : 'Save API Settings'}
        </button>
      </div>

      {/* Model Selection */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>🤖 Model Selection</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODELS.map(m => (
            <button
              key={m.value}
              className="question-item"
              onClick={() => setModel(m.value)}
              style={{
                background: model === m.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                borderColor: model === m.value ? 'var(--accent-primary)' : 'transparent',
                borderWidth: 1,
                borderStyle: 'solid',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {m.label}
                </div>
                <div className="caption">{m.desc}</div>
              </div>
              {model === m.value && (
                <div style={{ 
                  width: 24, height: 24, borderRadius: '50%', 
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={14} color="white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Target Score */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>🎯 Target Score</div>
        <div className="slider-value">{targetScore}</div>
        <div className="slider-container">
          <input
            className="slider"
            type="range"
            min="5.5"
            max="8.0"
            step="0.5"
            value={targetScore}
            onChange={e => setTargetScore(parseFloat(e.target.value))}
            id="target-score-slider"
          />
          <div className="slider-labels">
            <span className="slider-label">5.5</span>
            <span className="slider-label">6.0</span>
            <span className="slider-label">6.5</span>
            <span className="slider-label">7.0</span>
            <span className="slider-label">7.5</span>
            <span className="slider-label">8.0</span>
          </div>
        </div>
        <div className="caption" style={{ marginTop: 8, textAlign: 'center' }}>
          AI will tailor vocabulary and grammar complexity to match your target band score.
        </div>
      </div>

      {/* Data Management */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>📦 Data Management</div>
        <button
          className="btn btn-danger"
          onClick={handleClearData}
          style={{ width: '100%' }}
          id="clear-data-btn"
        >
          <Trash2 size={16} /> Clear Local Settings
        </button>
        <div className="caption" style={{ marginTop: 8 }}>
          This clears API key and preferences from your browser. Question bank data remains on the server.
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="heading-sm" style={{ marginBottom: 12 }}>ℹ️ About</div>
        <div className="body-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>IELTS Speaking AI Practice</strong> v1.0
          <br /><br />
          An AI-powered web application designed to help IELTS candidates prepare for the speaking test.
          Features include customizable question banks, AI-guided answer generation, and full mock exam simulations.
          <br /><br />
          <span style={{ color: 'var(--text-muted)' }}>
            Your API key is stored locally and used solely for generating AI responses.
          </span>
        </div>
      </div>
    </div>
  );
}
