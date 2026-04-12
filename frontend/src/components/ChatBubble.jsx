/**
 * ChatBubble - Message bubble for AI/user conversation
 */

export function ChatBubble({ message, sender = 'ai', children }) {
  return (
    <div className={`chat-bubble chat-bubble-${sender === 'ai' ? 'ai' : 'user'}`}>
      {sender === 'ai' && (
        <div className="chat-sender">🤖 AI Tutor</div>
      )}
      {sender === 'user' && (
        <div className="chat-sender">👤 You</div>
      )}
      {message && <div>{message}</div>}
      {children}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="chat-bubble chat-bubble-ai">
      <div className="chat-sender">🤖 AI Tutor</div>
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
