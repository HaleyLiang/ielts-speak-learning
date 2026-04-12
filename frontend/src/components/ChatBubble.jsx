/**
 * ChatBubble - Message bubble for AI/user conversation
 */

import useI18n from '../i18n/useI18n';

export function ChatBubble({ message, sender = 'ai', children }) {
  const { t } = useI18n();

  return (
    <div className={`chat-bubble chat-bubble-${sender === 'ai' ? 'ai' : 'user'}`}>
      {sender === 'ai' && (
        <div className="chat-sender">{t('chat.aiTutor')}</div>
      )}
      {sender === 'user' && (
        <div className="chat-sender">{t('chat.you')}</div>
      )}
      {message && <div>{message}</div>}
      {children}
    </div>
  );
}

export function TypingIndicator() {
  const { t } = useI18n();

  return (
    <div className="chat-bubble chat-bubble-ai">
      <div className="chat-sender">{t('chat.aiTutor')}</div>
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
