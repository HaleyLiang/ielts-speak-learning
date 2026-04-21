/**
 * QuestionDetail - Full page for viewing/editing a question's answer
 * Supports editing the saved answer, AI polish, and prev/next question navigation
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import useStore from '../stores/useStore';
import useI18n from '../i18n/useI18n';
import SpeakButton from '../components/SpeakButton';
import { fetchTopic, saveAnswer, polishAnswer } from '../services/api';

export default function QuestionDetail() {
  const { t } = useI18n();
  const { topicId, questionId } = useParams();
  const navigate = useNavigate();
  const { apiKey, model, baseUrl, targetScore } = useStore();

  const [question, setQuestion] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [topicTitle, setTopicTitle] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const topic = await fetchTopic(Number(topicId));
        setTopicTitle(topic.title);
        setAllQuestions(topic.questions || []);
        const q = topic.questions.find(q => q.id === Number(questionId));
        if (q) {
          setQuestion(q);
          setAnswerText(q.personal_answer?.answer_text || '');
        }
      } catch (err) {
        console.error('Failed to load question:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [topicId, questionId]);

  // Reset polish result and status when navigating to a different question
  useEffect(() => {
    setPolishResult(null);
    setStatusMsg('');
  }, [questionId]);

  const currentIndex = allQuestions.findIndex(q => q.id === Number(questionId));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allQuestions.length - 1;

  const goToQuestion = useCallback((direction) => {
    const targetIdx = currentIndex + direction;
    if (targetIdx < 0 || targetIdx >= allQuestions.length) return;
    const targetQ = allQuestions[targetIdx];
    navigate(`/bank/${topicId}/${targetQ.id}`, { replace: true });
  }, [currentIndex, allQuestions, topicId, navigate]);

  const handleSaveAnswer = async () => {
    if (!answerText.trim()) return;
    setSaving(true);
    setStatusMsg('');
    try {
      await saveAnswer({
        question_id: question.id,
        answer_text: answerText,
        key_phrases: polishResult?.key_phrases?.join(', ') || question.personal_answer?.key_phrases || null,
        target_score: targetScore,
      });
      setStatusMsg(t('bank.answerSaved'));
      // Refresh the question data
      const topic = await fetchTopic(Number(topicId));
      const updated = topic.questions.find(q => q.id === Number(questionId));
      if (updated) setQuestion(updated);
      setAllQuestions(topic.questions || []);
    } catch (err) {
      setStatusMsg(t('bank.saveFailed') + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePolish = async () => {
    if (!answerText.trim()) return;
    if (!apiKey) {
      alert(t('bank.alertNoApiKey'));
      return;
    }
    setPolishing(true);
    setPolishResult(null);
    setStatusMsg('');
    try {
      const result = await polishAnswer({
        question_text: question.text,
        answer_text: answerText,
        target_score: targetScore,
        api_key: apiKey,
        model,
        base_url: baseUrl || undefined,
      });
      setPolishResult(result);
      setAnswerText(result.polished_text);
      setStatusMsg(t('bank.polishSuccess'));
    } catch (err) {
      setStatusMsg(t('bank.polishFailed') + err.message);
    } finally {
      setPolishing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-overlay"><div className="spinner" /></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="page-container">
        <button className="btn btn-ghost" onClick={() => navigate('/bank')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={18} /> {t('bank.title')}
        </button>
        <div className="empty-state">
          <div className="empty-state-title">Question not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: 100 }}>
      {/* Back Button Header */}
      <div className="page-header" style={{ paddingBottom: 12, paddingTop: 4 }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/bank')}
          style={{ padding: '6px 0', gap: 4 }}
          id="back-to-bank-btn"
        >
          <ArrowLeft size={18} />
          <span style={{ fontSize: '0.875rem' }}>{topicTitle || t('bank.title')}</span>
        </button>
      </div>

      {/* Question Text with Prev/Next Navigation */}
      <div className="card" style={{ marginBottom: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="caption">{t('bank.questionDetail')}</div>
          {allQuestions.length > 1 && (
            <div className="caption" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
              {currentIndex + 1} / {allQuestions.length}
            </div>
          )}
        </div>
        <div className="heading-sm" style={{ lineHeight: 1.5 }}>{question.text}</div>
        {/* Prev / Next arrows */}
        {allQuestions.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => goToQuestion(-1)}
              disabled={!hasPrev}
              style={{ opacity: hasPrev ? 1 : 0.3, gap: 4 }}
              id="prev-question-btn"
            >
              <ChevronLeft size={16} /> {t('bank.prevQuestion')}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => goToQuestion(1)}
              disabled={!hasNext}
              style={{ opacity: hasNext ? 1 : 0.3, gap: 4 }}
              id="next-question-btn"
            >
              {t('bank.nextQuestion')} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Answer Editor */}
      <div className="input-group" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
            {t('bank.myAnswer')}
            {question.personal_answer && (
              <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                {question.personal_answer.updated_at
                  ? `${t('common.save')} ${new Date(question.personal_answer.updated_at).toLocaleDateString()}`
                  : '✓'}
              </span>
            )}
          </label>
          {answerText.trim() && (
            <SpeakButton 
              text={answerText} 
              className="btn-ghost" 
              style={{ padding: '6px', minHeight: 'unset', height: 'auto' }} 
            />
          )}
        </div>
        <textarea
          className="input textarea"
          placeholder={t('bank.answerPlaceholder')}
          rows={10}
          value={answerText}
          onChange={e => { setAnswerText(e.target.value); setStatusMsg(''); setPolishResult(null); }}
          style={{ fontSize: '0.9375rem', lineHeight: 1.8 }}
          id="question-answer-input"
        />
      </div>

      {/* Polish Result: Changes Summary */}
      {polishResult?.changes_summary && (
        <div className="card" style={{ marginBottom: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="caption" style={{ marginBottom: 6 }}>{t('bank.changeSummary')}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {polishResult.changes_summary}
          </div>
        </div>
      )}

      {/* Polish Result: Key Phrases */}
      {polishResult?.key_phrases?.length > 0 && (
        <div className="card" style={{ marginBottom: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="caption" style={{ marginBottom: 6 }}>{t('bank.keyPhrases')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {polishResult.key_phrases.map((p, i) => (
              <span key={i} className="badge badge-primary" style={{ fontSize: '0.8125rem' }}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMsg && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: 10,
          fontSize: '0.875rem',
          background: statusMsg.includes('✅') || statusMsg.includes('✨')
            ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          color: statusMsg.includes('✅') || statusMsg.includes('✨')
            ? 'var(--success)' : 'var(--error)',
        }}>
          {statusMsg}
        </div>
      )}

      {/* Sticky Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 8,
        zIndex: 50,
      }}>
        <button
          className="btn btn-primary"
          onClick={handleSaveAnswer}
          disabled={saving || !answerText.trim()}
          style={{ flex: 1 }}
          id="save-answer-btn"
        >
          <Save size={16} />
          {saving ? t('common.loading') : t('bank.saveAnswer')}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handlePolish}
          disabled={polishing || !answerText.trim()}
          style={{ flex: 1 }}
          id="ai-polish-btn"
        >
          <Sparkles size={16} />
          {polishing ? t('bank.polishing') : t('bank.aiPolish')}
        </button>
      </div>
    </div>
  );
}

