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
  usage: () => request('/usage'),
  automation: () => request('/automation'),
  saveAutomation: (body) => request('/automation', { method: 'POST', body }),

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
  measureNiche: (id, keyword) => request(`/niches/${id}/measure`, { method: 'POST', body: { keyword } }),

  ideas: () => request('/ideas'),
  setIdeaStatus: (id, status) => request(`/ideas/${id}`, { method: 'PATCH', body: { status } }),
  preflight: (id, body) => request(`/ideas/${id}/preflight`, { method: 'POST', body }),
  publishIdea: (id, body) => request(`/ideas/${id}/publish`, { method: 'POST', body }),

  actions: () => request('/actions'),
  refreshActions: () => request('/actions/refresh', { method: 'POST' }),
  setActionStatus: (id, status) => request(`/actions/${id}`, { method: 'PATCH', body: { status } }),

  keys: () => request('/settings/keys'),
  saveKeys: (body) => request('/settings/keys', { method: 'POST', body }),

  etsyStatus: () => request('/etsy/status'),
  keywordStats: (q) => request(`/etsy/keyword?q=${encodeURIComponent(q)}`),

  channels: () => request('/margin/channels'),
  calcMargin: (body) => request('/margin/calc', { method: 'POST', body }),

  printifyStatus: () => request('/printify/status'),
  blueprintProviders: (id) => request(`/printify/blueprints/${id}/providers`),
  variants: (id, providerId) => request(`/printify/blueprints/${id}/providers/${providerId}/variants`),
  blueprints: () => request('/printify/blueprints'),
};
