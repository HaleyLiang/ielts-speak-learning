/**
 * MockExam - Full IELTS speaking exam simulation
 * Flow: Part 1 (ID Check + Questions) → Part 2 (Cue Card + Speaking) → Part 3 (Discussion) → Report
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Mic, MicOff, ArrowRight, StopCircle, RotateCcw } from 'lucide-react';
import useStore from '../stores/useStore';
import { startExam, examRespond, transitionPart, endExam } from '../services/api';
import { ChatBubble, TypingIndicator } from '../components/ChatBubble';
import AudioWaveform from '../components/AudioWaveform';
import Timer from '../components/Timer';
import CueCard from '../components/CueCard';
import ScoreCard from '../components/ScoreCard';
import { startListening, stopListening } from '../services/speech';

const PART_LABELS = {
  part1: 'Part 1',
  part2: 'Part 2',
  part3: 'Part 3',
};

export default function MockExam() {
  const { apiKey, model, baseUrl, targetScore } = useStore();
  const [status, setStatus] = useState('idle'); // idle | running | part2-prep | scoring | completed
  const [currentPart, setCurrentPart] = useState('part1');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [cueCard, setCueCard] = useState(null);
  const [part2Timer, setPart2Timer] = useState(null); // 'prep' | 'speaking'
  const stopRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const addMessage = (role, text) => {
    setMessages(prev => [...prev, { role, text, time: new Date().toISOString() }]);
  };

  // Start exam
  const handleStartExam = async () => {
    if (!apiKey) {
      alert('Please set your API key in Settings first.');
      return;
    }

    setLoading(true);
    try {
      const result = await startExam({
        api_key: apiKey,
        model,
        target_score: targetScore,
        base_url: baseUrl || undefined,
      });

      setSessionId(result.session_id);
      setCurrentPart('part1');
      setStatus('running');
      addMessage('examiner', result.first_question);
    } catch (err) {
      alert('Failed to start exam: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Record + send response
  const handleStartRecording = () => {
    setTranscript('');
    setIsRecording(true);

    stopRef.current = startListening(
      (result) => setTranscript(result.transcript),
      (error) => {
        console.error('Speech error:', error);
        setIsRecording(false);
      },
      () => setIsRecording(false)
    );
  };

  const handleStopAndSend = async () => {
    stopListening();
    stopRef.current?.();
    setIsRecording(false);

    const spokenText = transcript.trim();
    if (!spokenText) return;

    addMessage('candidate', spokenText);
    setTranscript('');
    setLoading(true);

    try {
      const result = await examRespond({
        session_id: sessionId,
        user_response: spokenText,
        current_part: currentPart,
        api_key: apiKey,
        model,
        base_url: baseUrl || undefined,
      });

      addMessage('examiner', result.examiner_response);
    } catch (err) {
      addMessage('examiner', `[Error: ${err.message}]`);
    } finally {
      setLoading(false);
    }
  };

  // Send typed response (for Part 2 notes, etc.)
  const [typedInput, setTypedInput] = useState('');

  const handleSendTyped = async () => {
    if (!typedInput.trim()) return;
    const text = typedInput;
    setTypedInput('');
    addMessage('candidate', text);
    setLoading(true);

    try {
      const result = await examRespond({
        session_id: sessionId,
        user_response: text,
        current_part: currentPart,
        api_key: apiKey,
        model,
        base_url: baseUrl || undefined,
      });

      addMessage('examiner', result.examiner_response);
    } catch (err) {
      addMessage('examiner', `[Error: ${err.message}]`);
    } finally {
      setLoading(false);
    }
  };

  // Transition to next part
  const handleNextPart = async (nextPart) => {
    setLoading(true);
    try {
      const result = await transitionPart({
        session_id: sessionId,
        user_response: '',
        current_part: nextPart,
        api_key: apiKey,
        model,
        base_url: baseUrl || undefined,
      });

      setCurrentPart(nextPart);
      addMessage('examiner', result.examiner_response);

      if (nextPart === 'part2' && result.cue_card) {
        setCueCard(result.cue_card);
        setStatus('part2-prep');
        setPart2Timer('prep');
      }
    } catch (err) {
      addMessage('examiner', `[Error: ${err.message}]`);
    } finally {
      setLoading(false);
    }
  };

  // Part 2 prep → speaking transition
  const handlePrepComplete = () => {
    setPart2Timer('speaking');
    setStatus('running');
  };

  const handlePart2SpeakingComplete = () => {
    // Part 2 time is up
    addMessage('examiner', "Thank you. That's the end of Part 2.");
  };

  // End exam and get report
  const handleEndExam = async () => {
    setStatus('scoring');
    setLoading(true);

    try {
      const result = await endExam({
        session_id: sessionId,
        target_score: targetScore,
        api_key: apiKey,
        model,
        base_url: baseUrl || undefined,
      });

      setReport(result);
      setStatus('completed');
    } catch (err) {
      alert('Failed to generate report: ' + err.message);
      setStatus('running');
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setStatus('idle');
    setCurrentPart('part1');
    setSessionId(null);
    setMessages([]);
    setTranscript('');
    setReport(null);
    setCueCard(null);
    setPart2Timer(null);
    setTypedInput('');
    setIsRecording(false);
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Mock Exam</h1>
        <p className="page-subtitle">Full IELTS speaking simulation</p>
      </div>

      {/* Idle State */}
      {status === 'idle' && (
        <div className="empty-state">
          <div className="empty-state-icon"><Play size={28} /></div>
          <div className="empty-state-title">Start Mock Exam</div>
          <div className="empty-state-text">
            Experience a full IELTS speaking test with AI examiner and get a detailed score report.
          </div>

          <div className="card" style={{ marginTop: 24, textAlign: 'left', width: '100%' }}>
            <div className="heading-sm" style={{ marginBottom: 12 }}>Exam Structure</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { part: 'Part 1', desc: 'ID Check + 3 topics (4-5 min)', color: '#60A5FA' },
                { part: 'Part 2', desc: '1 min prep + 2 min speech', color: '#A78BFA' },
                { part: 'Part 3', desc: 'Discussion (4-5 min)', color: '#818CF8' },
              ].map(({ part, desc, color }) => (
                <div key={part} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{part}</div>
                    <div className="caption">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleStartExam}
            disabled={loading}
            style={{ marginTop: 24 }}
            id="start-exam-btn"
          >
            {loading ? <div className="spinner" /> : <><Play size={20} /> Begin Exam</>}
          </button>
        </div>
      )}

      {/* Running State */}
      {(status === 'running' || status === 'part2-prep' || status === 'scoring') && (
        <>
          {/* Exam Progress Bar */}
          <div className="exam-progress">
            {['part1', 'part2', 'part3'].map(part => (
              <div key={part} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className={`exam-progress-step ${
                  currentPart === part ? 'current' : 
                  (part === 'part1' && currentPart !== 'part1') || 
                  (part === 'part2' && currentPart === 'part3') ? 'active' : ''
                }`}>
                  <div className="exam-progress-fill" />
                </div>
                <span className={`exam-progress-label ${currentPart === part ? 'active' : ''}`}>
                  {PART_LABELS[part]}
                </span>
              </div>
            ))}
          </div>

          {/* Part 2 Prep Mode */}
          {status === 'part2-prep' && cueCard && (
            <div style={{ margin: '16px 0' }}>
              <CueCard topic={cueCard} />
              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <Timer
                  duration={60}
                  isRunning={part2Timer === 'prep'}
                  onComplete={handlePrepComplete}
                  label="PREP TIME"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handlePrepComplete}
                style={{ width: '100%' }}
              >
                I'm Ready to Speak
              </button>
            </div>
          )}

          {/* Part 2 Speaking Timer */}
          {status === 'running' && currentPart === 'part2' && part2Timer === 'speaking' && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
              <Timer
                duration={120}
                isRunning={true}
                onComplete={handlePart2SpeakingComplete}
                label="SPEAKING"
              />
            </div>
          )}

          {/* Chat Messages */}
          <div className="chat-container" style={{ marginTop: status === 'part2-prep' ? 0 : 8 }}>
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                message={msg.text}
                sender={msg.role === 'examiner' ? 'ai' : 'user'}
              />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Recording / Input Area */}
          {status === 'running' && (
            <div style={{ marginTop: 16 }}>
              {/* Waveform */}
              {isRecording && <AudioWaveform isActive={isRecording} />}

              {/* Transcript Preview */}
              {transcript && (
                <div className="card" style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div className="caption" style={{ marginBottom: 4 }}>Hearing:</div>
                  {transcript}
                </div>
              )}

              {/* Mic + Controls */}
              <div className="mic-button-container" style={{ marginTop: 12 }}>
                <button
                  className={`mic-button ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? handleStopAndSend : handleStartRecording}
                  disabled={loading}
                  id="exam-mic-btn"
                >
                  {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <span className="mic-label">
                  {isRecording ? 'Tap to send' : 'Tap to speak'}
                </span>
              </div>

              {/* Text input fallback */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  className="input"
                  placeholder="Or type your response..."
                  value={typedInput}
                  onChange={e => setTypedInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendTyped()}
                  style={{ flex: 1 }}
                  id="exam-text-input"
                />
                <button className="btn btn-primary" onClick={handleSendTyped} disabled={!typedInput.trim() || loading}>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Part Transition / End Exam */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {currentPart === 'part1' && (
                  <button className="btn btn-secondary" onClick={() => handleNextPart('part2')} disabled={loading} style={{ flex: 1 }}>
                    <ArrowRight size={16} /> Move to Part 2
                  </button>
                )}
                {currentPart === 'part2' && (
                  <button className="btn btn-secondary" onClick={() => handleNextPart('part3')} disabled={loading} style={{ flex: 1 }}>
                    <ArrowRight size={16} /> Move to Part 3
                  </button>
                )}
                <button className="btn btn-danger" onClick={handleEndExam} disabled={loading}>
                  <StopCircle size={16} /> End Exam
                </button>
              </div>
            </div>
          )}

          {/* Scoring Loading */}
          {status === 'scoring' && (
            <div className="empty-state" style={{ paddingTop: 32 }}>
              <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
              <div className="heading-sm" style={{ marginTop: 16 }}>Generating your report...</div>
              <div className="caption">The AI examiner is evaluating your performance</div>
            </div>
          )}
        </>
      )}

      {/* Completed - Show Report */}
      {status === 'completed' && report && (
        <>
          <ScoreCard report={report} />
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={handleReset}>
              <RotateCcw size={18} /> New Exam
            </button>
          </div>
        </>
      )}
    </div>
  );
}
