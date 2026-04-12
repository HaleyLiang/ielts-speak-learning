/**
 * ScoreCard - Exam results display with scores and feedback
 */

import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function ScoreCard({ report }) {
  const [expandedSections, setExpandedSections] = useState({});

  if (!report) return null;

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scoreColor = (score) => {
    if (score >= 7) return 'var(--success)';
    if (score >= 6) return 'var(--text-accent)';
    if (score >= 5) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="animate-slide-up">
      {/* Overall Score */}
      <div className="score-overview">
        <div>
          <div className="score-big">{report.overall_band}</div>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, marginTop: 4 }}>
            OVERALL BAND
          </div>
        </div>
      </div>

      {/* Four Criteria */}
      <div className="score-criteria">
        {[
          { key: 'fc_score', label: 'Fluency', full: 'Fluency & Coherence' },
          { key: 'lr_score', label: 'Lexical', full: 'Lexical Resource' },
          { key: 'gra_score', label: 'Grammar', full: 'Grammar Range' },
          { key: 'pr_score', label: 'Pronun.', full: 'Pronunciation' },
        ].map(({ key, label }) => (
          <div key={key} className="score-criterion">
            <div className="score-criterion-label">{label}</div>
            <div className="score-criterion-value" style={{ color: scoreColor(report[key] || 0) }}>
              {report[key] || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Gap Analysis */}
      {report.gap_analysis && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="heading-sm" style={{ marginBottom: 8 }}>📊 Gap Analysis</div>
          <div className="body-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {report.gap_analysis}
          </div>
        </div>
      )}

      {/* Part Feedback */}
      {['part1_feedback', 'part2_feedback', 'part3_feedback'].map((key, i) => {
        const feedback = report[key];
        if (!feedback) return null;
        const partNum = i + 1;
        const isExpanded = expandedSections[key];

        return (
          <div key={key} className="card" style={{ marginTop: 12 }}>
            <button
              className="accordion-header"
              onClick={() => toggleSection(key)}
              style={{ padding: 0, marginBottom: isExpanded ? 12 : 0 }}
            >
              <div style={{ flex: 1 }}>
                <span className="heading-sm">Part {partNum}</span>
                <span className="mono" style={{ 
                  marginLeft: 8, 
                  color: scoreColor(feedback.score),
                  fontWeight: 700,
                }}>
                  {feedback.score}
                </span>
              </div>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isExpanded && (
              <div className="animate-fade-in">
                <div className="body-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {feedback.feedback}
                </div>
                {feedback.highlights?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="caption" style={{ marginBottom: 6 }}>✨ Highlights</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {feedback.highlights.map((h, j) => (
                        <span key={j} className="badge badge-info">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Grammar Corrections */}
      {report.grammar_corrections?.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <button
            className="accordion-header"
            onClick={() => toggleSection('grammar')}
            style={{ padding: 0, marginBottom: expandedSections.grammar ? 12 : 0 }}
          >
            <span className="heading-sm">🔧 Grammar Corrections</span>
            <span className="badge badge-muted">{report.grammar_corrections.length}</span>
            {expandedSections.grammar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expandedSections.grammar && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.grammar_corrections.map((item, i) => (
                <div key={i} className="feedback-item">
                  <div className="feedback-icon feedback-correction">
                    <AlertCircle size={12} />
                  </div>
                  <div className="feedback-text">
                    <div className="feedback-original">{item.original}</div>
                    <div className="feedback-corrected">{item.corrected}</div>
                    {item.explanation && (
                      <div className="feedback-explanation">{item.explanation}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Better Expressions */}
      {report.better_expressions?.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <button
            className="accordion-header"
            onClick={() => toggleSection('expressions')}
            style={{ padding: 0, marginBottom: expandedSections.expressions ? 12 : 0 }}
          >
            <span className="heading-sm">💡 Better Expressions</span>
            <span className="badge badge-muted">{report.better_expressions.length}</span>
            {expandedSections.expressions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expandedSections.expressions && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.better_expressions.map((item, i) => (
                <div key={i} className="feedback-item">
                  <div className="feedback-icon feedback-suggestion">
                    <ArrowRight size={12} />
                  </div>
                  <div className="feedback-text">
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.original}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      → {item.suggested}
                    </div>
                    {item.reason && (
                      <div className="feedback-explanation">{item.reason}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
