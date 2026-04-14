import { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import useI18n from '../i18n/useI18n';

export default function SpeakButton({ text, className = '', showText = false, style = {} }) {
  const { t } = useI18n();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // If text changes or component unmounts, stop speaking
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  const toggleSpeak = () => {
    if (!text) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // English for IELTS
    utterance.lang = 'en-AU';
    utterance.rate = 0.6; // Slightly slower for language learning

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <button
      type="button"
      className={`btn ${className}`}
      onClick={toggleSpeak}
      title={isSpeaking ? t('common.stopSpeak') : t('common.speak')}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', ...style }}
    >
      {isSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
      {showText && <span>{isSpeaking ? t('common.stopSpeak') : t('common.speak')}</span>}
    </button>
  );
}
