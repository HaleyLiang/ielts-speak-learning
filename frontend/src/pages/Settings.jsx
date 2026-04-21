/**
 * Settings - API configuration, model selection (preset + custom), target score,
 *            language switcher, and data management
 */

import { useState } from 'react';
import { Eye, EyeOff, Trash2, Check, Plus, Sun, Moon } from 'lucide-react';
import useStore from '../stores/useStore';
import useI18n from '../i18n/useI18n';
import { SUPPORTED_LANGUAGES } from '../i18n/locales';

const PRESET_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4-turbo',
  'deepseek-chat',
  'deepseek-reasoner',
];

export default function Settings() {
  const {
    apiKey, setApiKey,
    model, setModel,
    baseUrl, setBaseUrl,
    targetScore, setTargetScore,
    language, setLanguage,
    theme, setTheme,
  } = useStore();
  const { t } = useI18n();

  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [localUrl, setLocalUrl] = useState(baseUrl);
  const [saved, setSaved] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Check if current model is a preset or custom
  const isCustomModel = !PRESET_MODELS.includes(model);

  const handleSave = () => {
    setApiKey(localKey);
    setBaseUrl(localUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSelectModel = (m) => {
    setModel(m);
    setShowCustomInput(false);
    setCustomModelInput('');
  };

  const handleUseCustomModel = () => {
    const trimmed = customModelInput.trim();
    if (!trimmed) return;
    setModel(trimmed);
    setShowCustomInput(false);
    setCustomModelInput('');
  };

  const handleClearData = () => {
    if (confirm(t('settings.clearConfirm'))) {
      localStorage.removeItem('ielts-practice-storage');
      window.location.reload();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      {/* API Configuration */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>{t('settings.apiConfig')}</div>

        <div className="input-group">
          <label className="input-label">{t('settings.apiKey')}</label>
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
            {t('settings.apiKeyHint')}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">{t('settings.baseUrl')}</label>
          <input
            className="input"
            type="text"
            placeholder={t('settings.baseUrlPlaceholder')}
            value={localUrl}
            onChange={e => setLocalUrl(e.target.value)}
            id="base-url-input"
          />
          <div className="caption" style={{ marginTop: 4 }}>
            {t('settings.baseUrlHint')}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          style={{ width: '100%' }}
          id="save-api-btn"
        >
          {saved ? <><Check size={16} /> {t('settings.saved')}</> : t('settings.saveApi')}
        </button>
      </div>

      {/* Model Selection */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>{t('settings.modelSelection')}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Preset models */}
          {PRESET_MODELS.map(m => {
            const modelInfo = t(`models.${m}`);
            return (
              <button
                key={m}
                className="question-item"
                onClick={() => handleSelectModel(m)}
                style={{
                  background: model === m ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                  borderColor: model === m ? 'var(--accent-primary)' : 'transparent',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              >
                <div style={{ marginRight: 16 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {modelInfo?.label || m}
                  </div>
                  <div className="caption">{modelInfo?.desc || ''}</div>
                </div>
                <div style={{
                  flexShrink: 0,
                  alignSelf: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: model === m ? 'var(--accent-gradient)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {model === m && <Check size={14} color="white" />}
                </div>
              </button>
            );
          })}

          {/* Custom model display (when a custom model is active) */}
          {isCustomModel && (
            <button
              className="question-item"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'var(--accent-primary)',
                borderWidth: 1,
                borderStyle: 'solid',
              }}
            >
              <div style={{ marginRight: 16 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {model}
                </div>
                <div className="caption">{t('settings.customModel')}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={14} color="white" />
              </div>
            </button>
          )}

          {/* Custom model input toggle */}
          {!showCustomInput ? (
            <button
              className="question-item"
              onClick={() => setShowCustomInput(true)}
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'transparent',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: 'var(--border)',
              }}
              id="custom-model-toggle"
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={16} color="var(--text-muted)" />
                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {t('settings.customModel')}
                </div>
              </div>
            </button>
          ) : (
            <div style={{
              padding: 12,
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              <div className="input-group" style={{ marginBottom: 8 }}>
                <input
                  className="input"
                  type="text"
                  placeholder={t('settings.customModelPlaceholder')}
                  value={customModelInput}
                  onChange={e => setCustomModelInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUseCustomModel()}
                  autoFocus
                  id="custom-model-input"
                />
              </div>
              <div className="caption" style={{ marginBottom: 8 }}>
                {t('settings.customModelHint')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleUseCustomModel}
                  disabled={!customModelInput.trim()}
                  style={{ flex: 1 }}
                >
                  <Check size={14} /> {t('settings.useCustom')}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setShowCustomInput(false); setCustomModelInput(''); }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Target Score */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>{t('settings.targetScore')}</div>
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
          {t('settings.targetScoreHint')}
        </div>
      </div>

      {/* Language Switcher */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>{t('settings.language')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className="btn"
              onClick={() => setLanguage(lang.code)}
              style={{
                flex: 1,
                background: language === lang.code ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                borderColor: language === lang.code ? 'var(--accent-primary)' : 'var(--border)',
                borderWidth: 1,
                borderStyle: 'solid',
                color: language === lang.code ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: language === lang.code ? 600 : 400,
              }}
              id={`lang-${lang.code}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>{t('settings.theme')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn"
            onClick={() => setTheme('light')}
            style={{
              flex: 1,
              background: theme === 'light' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
              borderColor: theme === 'light' ? 'var(--accent-primary)' : 'var(--border-default)',
              borderWidth: 1,
              borderStyle: 'solid',
              color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: theme === 'light' ? 600 : 400,
            }}
            id="theme-light-btn"
          >
            <Sun size={16} /> {t('settings.themeLight')}
          </button>
          <button
            className="btn"
            onClick={() => setTheme('dark')}
            style={{
              flex: 1,
              background: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
              borderColor: theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-default)',
              borderWidth: 1,
              borderStyle: 'solid',
              color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: theme === 'dark' ? 600 : 400,
            }}
            id="theme-dark-btn"
          >
            <Moon size={16} /> {t('settings.themeDark')}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="heading-sm" style={{ marginBottom: 16 }}>{t('settings.dataManagement')}</div>
        <button
          className="btn btn-danger"
          onClick={handleClearData}
          style={{ width: '100%' }}
          id="clear-data-btn"
        >
          <Trash2 size={16} /> {t('settings.clearSettings')}
        </button>
        <div className="caption" style={{ marginTop: 8 }}>
          {t('settings.clearHint')}
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="heading-sm" style={{ marginBottom: 12 }}>{t('settings.about')}</div>
        <div className="body-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>IELTS Speaking AI Practice</strong> v1.0
          <br /><br />
          {t('settings.aboutText')}
          <br /><br />
          <span style={{ color: 'var(--text-muted)' }}>
            {t('settings.aboutPrivacy')}
          </span>
        </div>
      </div>
    </div>
  );
}
