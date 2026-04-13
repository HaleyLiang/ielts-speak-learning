/**
 * QuestionDetail - Full page for viewing/editing a question's answer
 * Supports editing the saved answer and AI polish
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import useStore from '../stores/useStore';
import useI18n from '../i18n/useI18n';
import { fetchTopic, saveAnswer, polishAnswer } from '../services/api';

export default function QuestionDetail() {
  const { t } = useI18n();
  const { topicId, questionId } = useParams();
  const navigate = useNavigate();
  const { apiKey, model, baseUrl, targetScore } = useStore();

  const [question, setQuestion] = useState(null);
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
      {/* Back Button */}
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/bank')}
        style={{ marginBottom: 12, padding: '6px 0', gap: 4 }}
        id="back-to-bank-btn"
      >
        <ArrowLeft size={18} />
        <span style={{ fontSize: '0.875rem' }}>{topicTitle || t('bank.title')}</span>
      </button>

      {/* Question Text */}
      <div className="card" style={{ marginBottom: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div className="caption" style={{ marginBottom: 6 }}>{t('bank.questionDetail')}</div>
        <div className="heading-sm" style={{ lineHeight: 1.5 }}>{question.text}</div>
      </div>

      {/* Answer Editor */}
      <div className="input-group" style={{ marginBottom: 16 }}>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {t('bank.myAnswer')}
          {question.personal_answer && (
            <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
              {question.personal_answer.updated_at
                ? `${t('common.save')} ${new Date(question.personal_answer.updated_at).toLocaleDateString()}`
                : '✓'}
            </span>
          )}
        </label>
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
