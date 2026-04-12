/**
 * PracticeMode - AI-guided answer generation and speaking practice
 * Flow: Draw Topics → Generate Answer → Practice Speaking
 */

import { useState, useRef } from 'react';
import { Shuffle, Mic, MicOff, Send, Save, RotateCcw, Sparkles, Volume2, Check } from 'lucide-react';
import useStore from '../stores/useStore';
import { drawRandomTopics, generateAnswer, compareAnswer, saveAnswer } from '../services/api';
import { ChatBubble, TypingIndicator } from '../components/ChatBubble';
import AudioWaveform from '../components/AudioWaveform';
import { startListening, stopListening } from '../services/speech';

export default function PracticeMode() {
  const { apiKey, model, baseUrl, targetScore } = useStore();
  const [step, setStep] = useState('idle'); // idle | topics | question-select | generating | answer | speaking | feedback
  const [topics, setTopics] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [generatedAnswer, setGeneratedAnswer] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const stopRef = useRef(null);

  const addMessage = (msg) => setChatMessages(prev => [...prev, msg]);

  // Step 1: Draw random topics
  const handleDraw = async () => {
    setLoading(true);
    try {
      const data = await drawRandomTopics();
      setTopics(data);
      setStep('topics');
      setChatMessages([{
        sender: 'ai',
        text: `🎲 I've drawn two topics for you!\n\n📗 **Part 1**: ${data.part1_topic.title}\n📘 **Part 2&3**: ${data.part2_3_topic.title}\n\nSelect a question below to start preparing your answer.`,
      }]);
    } catch (err) {
      alert('Failed to draw topics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select a question to work on
  const handleSelectQuestion = (question, part) => {
    setSelectedQuestion({ ...question, part });
    setStep('question-select');
    addMessage({
      sender: 'ai',
      text: `Great choice! Let's prepare for this question:\n\n"${question.text}"\n\nTell me your real thoughts, experiences, or ideas about this. You can write in Chinese or simple English keywords — I'll help you create a polished answer! 💡`,
    });
  };

  // Step 3: Generate personalized answer
  const handleGenerateAnswer = async () => {
    if (!userInput.trim()) return;
    if (!apiKey) {
      alert('Please set your API key in Settings first.');
      return;
    }

    addMessage({ sender: 'user', text: userInput });
    setStep('generating');
    setLoading(true);

    try {
      const result = await generateAnswer({
        question_id: selectedQuestion.id,
        question_text: selectedQuestion.text,
        user_input: userInput,
        target_score: targetScore,
        part: selectedQuestion.part,
        api_key: apiKey,
        model: model,
        base_url: baseUrl || undefined,
      });

      setGeneratedAnswer(result);
      setStep('answer');
      addMessage({
        sender: 'ai',
        text: `Here's your personalized answer (targeting Band ${targetScore}):\n\n"${result.answer_text}"\n\n✨ **Key Phrases**: ${result.key_phrases?.join(', ') || 'N/A'}\n\nYou can save this answer and then practice speaking it! 🎤`,
      });
    } catch (err) {
      addMessage({ sender: 'ai', text: `❌ Error: ${err.message}` });
      setStep('question-select');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Save answer to question bank
  const handleSave = async () => {
    if (!generatedAnswer) return;
    try {
      await saveAnswer({
        question_id: selectedQuestion.id,
        answer_text: generatedAnswer.answer_text,
        key_phrases: generatedAnswer.key_phrases?.join(', '),
        target_score: targetScore,
      });
      setIsSaved(true);
      addMessage({ sender: 'ai', text: '✅ Answer saved to your question bank!' });
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  // Step 5: Practice speaking
  const handleStartRecording = () => {
    setTranscript('');
    setIsRecording(true);
    setStep('speaking');

    stopRef.current = startListening(
      (result) => setTranscript(result.transcript),
      (error) => {
        console.error('Speech error:', error);
        setIsRecording(false);
      },
      (final) => {
        setIsRecording(false);
        setTranscript(final);
      }
    );
  };

  const handleStopRecording = async () => {
    stopListening();
    stopRef.current?.();
    setIsRecording(false);

    if (!transcript.trim()) {
      addMessage({ sender: 'ai', text: "I didn't catch anything. Try again? 🎤" });
      setStep('answer');
      return;
    }

    addMessage({ sender: 'user', text: transcript });
    setLoading(true);

    try {
      const result = await compareAnswer({
        question_id: selectedQuestion.id,
        user_spoken_text: transcript,
        reference_answer: generatedAnswer.answer_text,
        target_score: targetScore,
        api_key: apiKey,
        model: model,
        base_url: baseUrl || undefined,
      });

      setFeedback(result);
      setStep('feedback');
      addMessage({
        sender: 'ai',
        text: `📊 **Your Practice Feedback**\n\n🗣️ Fluency: ${result.fluency_score}/9\n📖 Vocabulary: ${result.vocabulary_score}/9\n\n💬 ${result.feedback}\n\n📝 **Suggestions:**\n${result.suggestions?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'Great job!'}`,
      });
    } catch (err) {
      addMessage({ sender: 'ai', text: `❌ Error comparing: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setStep('idle');
    setTopics(null);
    setSelectedQuestion(null);
    setUserInput('');
    setGeneratedAnswer(null);
    setTranscript('');
    setFeedback(null);
    setChatMessages([]);
    setIsSaved(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Practice Mode</h1>
        <p className="page-subtitle">AI-guided answer generation & speaking practice</p>
      </div>

      {/* Idle State */}
      {step === 'idle' && (
        <div className="empty-state">
          <div className="empty-state-icon"><Sparkles size={28} /></div>
          <div className="empty-state-title">Ready to Practice?</div>
          <div className="empty-state-text">
            Draw random topics, generate your personalized answer, and practice speaking!
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleDraw}
            disabled={loading}
            style={{ marginTop: 24 }}
            id="draw-topics-btn"
          >
            {loading ? <div className="spinner" /> : <><Shuffle size={20} /> Draw Topics</>}
          </button>
        </div>
      )}

      {/* Chat Interface */}
      {step !== 'idle' && (
        <>
          {/* Reset button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              <RotateCcw size={14} /> Start Over
            </button>
          </div>

          {/* Chat messages */}
          <div className="chat-container">
            {chatMessages.map((msg, i) => (
              <ChatBubble key={i} message={msg.text} sender={msg.sender} />
            ))}
            {loading && <TypingIndicator />}
          </div>

          {/* Topic Selection */}
          {step === 'topics' && topics && (
            <div style={{ marginTop: 16 }}>
              <div className="heading-sm" style={{ marginBottom: 12 }}>Select a question to prepare:</div>

              {/* Part 1 */}
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="part-tag part-tag-1" style={{ marginBottom: 10 }}>Part 1</div>
                <div className="heading-sm" style={{ marginBottom: 8 }}>{topics.part1_topic.title}</div>
                {topics.part1_topic.questions?.map(q => (
                  <button
                    key={q.id}
                    className="question-item"
                    onClick={() => handleSelectQuestion(q, 'part1')}
                    style={{ width: '100%', background: 'var(--bg-secondary)' }}
                  >
                    <div className="question-text">{q.text}</div>
                    {q.personal_answer && <Check size={14} color="var(--success)" />}
                  </button>
                ))}
              </div>

              {/* Part 2&3 */}
              <div className="card">
                <div className="part-tag part-tag-2" style={{ marginBottom: 10 }}>Part 2 & 3</div>
                <div className="heading-sm" style={{ marginBottom: 8 }}>{topics.part2_3_topic.title}</div>
                {topics.part2_3_topic.questions?.map(q => (
                  <button
                    key={q.id}
                    className="question-item"
                    onClick={() => handleSelectQuestion(q, 'part2_3')}
                    style={{ width: '100%', background: 'var(--bg-secondary)' }}
                  >
                    <div className="question-text">{q.text}</div>
                    {q.personal_answer && <Check size={14} color="var(--success)" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Input for Ideas */}
          {step === 'question-select' && (
            <div style={{ marginTop: 16 }}>
              <div className="input-group">
                <label className="input-label">Share your ideas (Chinese or English)</label>
                <textarea
                  className="input textarea"
                  placeholder="告诉我你对这个话题的真实想法..."
                  rows={4}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  id="user-ideas-input"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleGenerateAnswer}
                disabled={!userInput.trim() || loading}
                style={{ width: '100%' }}
              >
                <Sparkles size={16} /> Generate My Answer
              </button>
            </div>
          )}

          {/* Answer Actions: Save + Practice */}
          {(step === 'answer' || step === 'feedback') && generatedAnswer && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {!isSaved && (
                <button className="btn btn-secondary" onClick={handleSave}>
                  <Save size={16} /> Save Answer
                </button>
              )}
              {step === 'answer' && (
                <button className="btn btn-primary" onClick={handleStartRecording} style={{ flex: 1 }}>
                  <Mic size={16} /> Practice Speaking
                </button>
              )}
              {step === 'feedback' && (
                <button className="btn btn-primary" onClick={handleStartRecording} style={{ flex: 1 }}>
                  <Mic size={16} /> Try Again
                </button>
              )}
            </div>
          )}

          {/* Recording UI */}
          {step === 'speaking' && (
            <div style={{ marginTop: 16 }}>
              <AudioWaveform isActive={isRecording} />
              {transcript && (
                <div className="card" style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div className="caption" style={{ marginBottom: 4 }}>Live Transcript:</div>
                  {transcript}
                </div>
              )}
              <div className="mic-button-container" style={{ marginTop: 16 }}>
                <button
                  className={`mic-button ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  id="mic-btn"
                >
                  {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <span className="mic-label">
                  {isRecording ? 'Tap to stop' : 'Tap to record'}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
