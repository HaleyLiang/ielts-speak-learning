/**
 * QuestionBank - Manage IELTS speaking topics and questions
 * Accordion layout grouped by Part 1 / Part 2&3
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Plus, Trash2, Upload, Check, BookOpen, FileText } from 'lucide-react';
import useStore from '../stores/useStore';
import { fetchTopics, fetchTopic, createTopic, deleteTopic, addQuestion, importQuestions } from '../services/api';

export default function QuestionBank() {
  const [topics, setTopics] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', part: 'part1', questions: '' });
  const [importJson, setImportJson] = useState('');

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTopics();
      setTopics(data);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const handleExpand = async (topicId) => {
    if (expandedId === topicId) {
      setExpandedId(null);
      setExpandedTopic(null);
      return;
    }
    setExpandedId(topicId);
    try {
      const data = await fetchTopic(topicId);
      setExpandedTopic(data);
    } catch (err) {
      console.error('Failed to load topic:', err);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.title.trim()) return;
    try {
      const questions = newTopic.questions
        .split('\n')
        .map(q => q.trim())
        .filter(Boolean)
        .map(text => ({ text }));

      await createTopic({
        title: newTopic.title,
        part: newTopic.part,
        questions,
      });
      setShowAddModal(false);
      setNewTopic({ title: '', part: 'part1', questions: '' });
      loadTopics();
    } catch (err) {
      alert('Failed to add topic: ' + err.message);
    }
  };

  const handleDeleteTopic = async (topicId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this topic and all its questions?')) return;
    try {
      await deleteTopic(topicId);
      if (expandedId === topicId) {
        setExpandedId(null);
        setExpandedTopic(null);
      }
      loadTopics();
    } catch (err) {
      alert('Failed to delete topic: ' + err.message);
    }
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importJson);
      const importData = { topics: Array.isArray(data) ? data : data.topics || [data] };
      const result = await importQuestions(importData);
      alert(`Successfully imported ${result.imported} topics!`);
      setShowImportModal(false);
      setImportJson('');
      loadTopics();
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };

  const part1Topics = topics.filter(t => t.part === 'part1');
  const part2Topics = topics.filter(t => t.part === 'part2_3');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Question Bank</h1>
        <p className="page-subtitle">Manage your IELTS speaking topics</p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} id="add-topic-btn">
          <Plus size={16} /> Add Topic
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)} id="import-btn">
          <Upload size={16} /> Import
        </button>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : topics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} /></div>
          <div className="empty-state-title">No topics yet</div>
          <div className="empty-state-text">Add topics manually or import from a JSON file to get started.</div>
        </div>
      ) : (
        <div>
          {/* Part 1 Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="part-tag part-tag-1">Part 1</span>
              <span className="caption">{part1Topics.length} topics</span>
            </div>
            <div className="accordion">
              {part1Topics.map(topic => (
                <TopicAccordion
                  key={topic.id}
                  topic={topic}
                  isExpanded={expandedId === topic.id}
                  expandedData={expandedId === topic.id ? expandedTopic : null}
                  onToggle={() => handleExpand(topic.id)}
                  onDelete={(e) => handleDeleteTopic(topic.id, e)}
                />
              ))}
            </div>
          </div>

          {/* Part 2&3 Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="part-tag part-tag-2">Part 2 & 3</span>
              <span className="caption">{part2Topics.length} topics</span>
            </div>
            <div className="accordion">
              {part2Topics.map(topic => (
                <TopicAccordion
                  key={topic.id}
                  topic={topic}
                  isExpanded={expandedId === topic.id}
                  expandedData={expandedId === topic.id ? expandedTopic : null}
                  onToggle={() => handleExpand(topic.id)}
                  onDelete={(e) => handleDeleteTopic(topic.id, e)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="heading-lg" style={{ marginBottom: 20 }}>Add New Topic</h2>

            <div className="input-group">
              <label className="input-label">Topic Title</label>
              <input
                className="input"
                placeholder="e.g., Hometown"
                value={newTopic.title}
                onChange={e => setNewTopic(p => ({ ...p, title: e.target.value }))}
                id="topic-title-input"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Part</label>
              <select
                className="input select"
                value={newTopic.part}
                onChange={e => setNewTopic(p => ({ ...p, part: e.target.value }))}
                id="topic-part-select"
              >
                <option value="part1">Part 1</option>
                <option value="part2_3">Part 2 & 3</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Questions (one per line)</label>
              <textarea
                className="input textarea"
                placeholder="Where is your hometown?&#10;What do you like most about it?"
                rows={4}
                value={newTopic.questions}
                onChange={e => setNewTopic(p => ({ ...p, questions: e.target.value }))}
                id="topic-questions-input"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleAddTopic} style={{ flex: 1 }}>
                <Check size={16} /> Create Topic
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="heading-lg" style={{ marginBottom: 20 }}>Import Questions</h2>

            <div className="input-group">
              <label className="input-label">Paste JSON data</label>
              <textarea
                className="input textarea"
                placeholder={'[\n  {\n    "title": "Hometown",\n    "part": "part1",\n    "questions": [\n      {"text": "Where is your hometown?"}\n    ]\n  }\n]'}
                rows={10}
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}
                id="import-json-input"
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleImport} style={{ flex: 1 }}>
                <Upload size={16} /> Import
              </button>
              <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicAccordion({ topic, isExpanded, expandedData, onToggle, onDelete }) {
  const progress = topic.total_count > 0 ? (topic.prepared_count / topic.total_count) * 100 : 0;

  return (
    <div className="accordion-item">
      <button className="accordion-header" onClick={onToggle}>
        <ChevronRight size={16} className={`accordion-icon ${isExpanded ? 'open' : ''}`} />
        <div className="accordion-title">{topic.title}</div>
        <div className="accordion-meta">
          {topic.prepared_count === topic.total_count && topic.total_count > 0 ? (
            <span className="badge badge-success">
              <Check size={10} /> Ready
            </span>
          ) : topic.prepared_count > 0 ? (
            <span className="badge badge-warning">{topic.prepared_count}/{topic.total_count}</span>
          ) : (
            <span className="badge badge-muted">{topic.total_count} Q</span>
          )}
          <button className="btn-icon btn-ghost" onClick={onDelete} style={{ width: 28, height: 28 }}>
            <Trash2 size={14} color="var(--text-muted)" />
          </button>
        </div>
      </button>

      <div className={`accordion-content ${isExpanded ? 'open' : ''}`}>
        <div className="accordion-body">
          {/* Progress bar */}
          <div className="progress-bar" style={{ marginBottom: 8 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {expandedData?.questions?.map((q, i) => (
            <div key={q.id} className="question-item">
              <div className="question-number">{i + 1}</div>
              <div className="question-text">{q.text}</div>
              <div className="question-status">
                {q.personal_answer ? (
                  <Check size={16} color="var(--success)" />
                ) : (
                  <FileText size={16} color="var(--text-muted)" />
                )}
              </div>
            </div>
          ))}

          {!expandedData && (
            <div className="loading-overlay" style={{ padding: 16 }}>
              <div className="spinner" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
