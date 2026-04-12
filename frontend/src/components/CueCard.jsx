/**
 * CueCard - IELTS Part 2 topic card with notes area
 */

import { useState } from 'react';
import useI18n from '../i18n/useI18n';

export default function CueCard({ topic, onNotesChange }) {
  const [notes, setNotes] = useState('');
  const { t } = useI18n();

  // Parse "You should say" points from the topic text
  const parts = topic?.split(/you should say:/i) || [topic];
  const mainPrompt = parts[0]?.trim();
  
  let points = [];
  if (parts[1]) {
    points = parts[1]
      .split(/(?:,\s*and\s+|,\s+|\band\b\s+)/)
      .map(p => p.trim().replace(/^-\s*/, '').replace(/\.$/, ''))
      .filter(Boolean);
  }

  return (
    <div className="cue-card animate-scale-in">
      <div className="cue-card-title">{t('cueCard.title')}</div>
      <div className="cue-card-prompt">{mainPrompt}</div>
      
      {points.length > 0 && (
        <>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {t('cueCard.youShouldSay')}
          </div>
          <ul className="cue-card-points">
            {points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
          {t('cueCard.yourNotes')}
        </div>
        <textarea
          className="notes-area"
          placeholder={t('cueCard.notesPlaceholder')}
          value={notes}
          onChange={e => {
            setNotes(e.target.value);
            onNotesChange?.(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
