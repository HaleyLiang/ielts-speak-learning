/**
 * API Service - Backend communication layer
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network error', 0);
  }
}

// ─── Question Bank ──────────────────────────────────────────────

export async function fetchTopics() {
  return request('/questions/topics');
}

export async function fetchTopic(topicId) {
  return request(`/questions/topics/${topicId}`);
}

export async function createTopic(data) {
  return request('/questions/topics', { method: 'POST', body: data });
}

export async function deleteTopic(topicId) {
  return request(`/questions/topics/${topicId}`, { method: 'DELETE' });
}

export async function addQuestion(topicId, text) {
  return request(`/questions/topics/${topicId}/questions`, {
    method: 'POST',
    body: { text, sort_order: 0 },
  });
}

export async function deleteQuestion(questionId) {
  return request(`/questions/questions/${questionId}`, { method: 'DELETE' });
}

export async function saveAnswer(data) {
  return request('/questions/answers', { method: 'PUT', body: data });
}

export async function importQuestions(data) {
  return request('/questions/import', { method: 'POST', body: data });
}

// ─── Practice Mode ──────────────────────────────────────────────

export async function drawRandomTopics() {
  return request('/practice/random-topics', { method: 'POST' });
}

export async function generateAnswer(data) {
  return request('/practice/generate-answer', { method: 'POST', body: data });
}

export async function compareAnswer(data) {
  return request('/practice/compare', { method: 'POST', body: data });
}

export async function polishAnswer(data) {
  return request('/practice/polish', { method: 'POST', body: data });
}

// ─── Mock Exam ──────────────────────────────────────────────────

export async function startExam(data) {
  return request('/exam/start', { method: 'POST', body: data });
}

export async function examRespond(data) {
  return request('/exam/respond', { method: 'POST', body: data });
}

export async function transitionPart(data) {
  return request('/exam/transition-part', { method: 'POST', body: data });
}

export async function endExam(data) {
  return request('/exam/end', { method: 'POST', body: data });
}
