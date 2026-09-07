const request = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `İstek başarısız (${response.status})`);
  return data;
};

export const api = {
  status: () => request('/status'),

  topics: () => request('/topics'),
  addTopic: (body) => request('/topics', { method: 'POST', body }),
  updateTopic: (id, body) => request(`/topics/${id}`, { method: 'PATCH', body }),
  research: (topicId) => request('/research/run', { method: 'POST', body: { topicId } }),
  runs: () => request('/runs'),
  findings: () => request('/findings'),

  lessons: () => request('/lessons'),
  setLessonStatus: (id, status) => request(`/lessons/${id}`, { method: 'PATCH', body: { status } }),

  niches: () => request('/niches'),
  setNicheStatus: (id, status) => request(`/niches/${id}`, { method: 'PATCH', body: { status } }),
  generateIdeas: (id, count) => request(`/niches/${id}/ideas`, { method: 'POST', body: { count } }),

  ideas: () => request('/ideas'),
  setIdeaStatus: (id, status) => request(`/ideas/${id}`, { method: 'PATCH', body: { status } }),

  actions: () => request('/actions'),
  refreshActions: () => request('/actions/refresh', { method: 'POST' }),
  setActionStatus: (id, status) => request(`/actions/${id}`, { method: 'PATCH', body: { status } }),

  keys: () => request('/settings/keys'),
  saveKeys: (body) => request('/settings/keys', { method: 'POST', body }),

  printifyStatus: () => request('/printify/status'),
  blueprints: () => request('/printify/blueprints'),
};
