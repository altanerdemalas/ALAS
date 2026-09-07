import { Router } from 'express';
import { all, get, run, parseJson } from '../db.js';
import { config, hasAI, hasPrintify } from '../config.js';
import { listTopics, researchTopic, runResearchCycle, nextTopic } from '../agents/research.js';
import { generateIdeas } from '../agents/product.js';
import { refreshActions } from '../agents/coach.js';
import * as printify from '../integrations/printify.js';

export const api = Router();

/** Hata veren async handler'ları 500 + mesaja çevirir. */
const wrap = (handler) => (req, res) => {
  Promise.resolve(handler(req, res)).catch((error) => {
    console.error(error);
    res.status(500).json({ error: error.message });
  });
};

// ---------------------------------------------------------------- durum

api.get('/status', (req, res) => {
  const counts = get(`
    SELECT
      (SELECT COUNT(*) FROM topics WHERE active = 1)                AS topics,
      (SELECT COUNT(*) FROM findings)                               AS findings,
      (SELECT COUNT(*) FROM lessons)                                AS lessons,
      (SELECT COUNT(*) FROM lessons WHERE status = 'yeni')          AS lessons_new,
      (SELECT COUNT(*) FROM niches)                                 AS niches,
      (SELECT COUNT(*) FROM product_ideas)                          AS ideas,
      (SELECT COUNT(*) FROM actions WHERE status IN ('acik','yapiliyor')) AS actions_open,
      (SELECT COUNT(*) FROM runs WHERE status = 'done')             AS runs_done
  `);
  res.json({
    counts,
    ai: { connected: hasAI(), model: config.anthropic.model, effort: config.anthropic.effort },
    printify: { connected: hasPrintify(), shopId: config.printify.shopId || null },
    profile: config.profile,
    research: { cron: config.research.cron, next: nextTopic() },
    recentEvents: all('SELECT * FROM events ORDER BY id DESC LIMIT 12'),
  });
});

// ------------------------------------------------------------ araştırma

api.get('/topics', (req, res) => res.json(listTopics()));

api.post('/topics', (req, res) => {
  const { title, question, track = 'genel', priority = 2 } = req.body ?? {};
  if (!title || !question) return res.status(400).json({ error: 'title ve question zorunlu' });
  const { lastInsertRowid } = run(
    'INSERT INTO topics (title, question, track, priority) VALUES (?, ?, ?, ?)',
    title, question, track, Number(priority),
  );
  res.status(201).json(get('SELECT * FROM topics WHERE id = ?', lastInsertRowid));
});

api.patch('/topics/:id', (req, res) => {
  const { active, priority } = req.body ?? {};
  if (active !== undefined) run('UPDATE topics SET active = ? WHERE id = ?', active ? 1 : 0, req.params.id);
  if (priority !== undefined) run('UPDATE topics SET priority = ? WHERE id = ?', Number(priority), req.params.id);
  res.json(get('SELECT * FROM topics WHERE id = ?', req.params.id));
});

api.post('/research/run', wrap(async (req, res) => {
  const { topicId } = req.body ?? {};
  const result = topicId ? await researchTopic(topicId) : await runResearchCycle(1);
  res.json(result);
}));

api.get('/runs', (req, res) =>
  res.json(all(`
    SELECT r.*, t.title AS topic_title,
      (SELECT COUNT(*) FROM findings f WHERE f.run_id = r.id) AS finding_count
    FROM runs r LEFT JOIN topics t ON t.id = r.topic_id
    ORDER BY r.id DESC LIMIT 50
  `)));

api.get('/findings', (req, res) =>
  res.json(
    all('SELECT * FROM findings ORDER BY id DESC LIMIT 200')
      .map((f) => ({ ...f, sources: parseJson(f.sources) })),
  ));

// ----------------------------------------------------------------- ders

api.get('/lessons', (req, res) =>
  res.json(
    all('SELECT * FROM lessons ORDER BY level ASC, id DESC')
      .map((l) => ({ ...l, action_items: parseJson(l.action_items), sources: parseJson(l.sources) })),
  ));

api.patch('/lessons/:id', (req, res) => {
  const { status } = req.body ?? {};
  run('UPDATE lessons SET status = ? WHERE id = ?', status, req.params.id);
  res.json(get('SELECT * FROM lessons WHERE id = ?', req.params.id));
});

// ---------------------------------------------------------------- nişler

api.get('/niches', (req, res) => res.json(all('SELECT * FROM niches ORDER BY score DESC, id DESC')));

api.patch('/niches/:id', (req, res) => {
  run('UPDATE niches SET status = ? WHERE id = ?', req.body?.status, req.params.id);
  res.json(get('SELECT * FROM niches WHERE id = ?', req.params.id));
});

api.post('/niches/:id/ideas', wrap(async (req, res) => {
  const created = await generateIdeas(Number(req.params.id), Number(req.body?.count) || 3);
  res.json(created.map((i) => ({ ...i, tags: parseJson(i.tags) })));
}));

// --------------------------------------------------------- ürün fikirleri

api.get('/ideas', (req, res) =>
  res.json(
    all(`
      SELECT p.*, n.name AS niche_name FROM product_ideas p
      LEFT JOIN niches n ON n.id = p.niche_id ORDER BY p.id DESC
    `).map((i) => ({ ...i, tags: parseJson(i.tags) })),
  ));

api.patch('/ideas/:id', (req, res) => {
  run('UPDATE product_ideas SET status = ? WHERE id = ?', req.body?.status, req.params.id);
  res.json(get('SELECT * FROM product_ideas WHERE id = ?', req.params.id));
});

// -------------------------------------------------------------- görevler

api.get('/actions', (req, res) => res.json(all('SELECT * FROM actions ORDER BY status ASC, id DESC')));

api.post('/actions/refresh', wrap(async (req, res) => res.json(await refreshActions())));

api.patch('/actions/:id', (req, res) => {
  run('UPDATE actions SET status = ? WHERE id = ?', req.body?.status, req.params.id);
  res.json(get('SELECT * FROM actions WHERE id = ?', req.params.id));
});

// -------------------------------------------------------------- printify

api.get('/printify/status', wrap(async (req, res) => res.json(await printify.connectionStatus())));

api.get('/printify/blueprints', wrap(async (req, res) => {
  const blueprints = await printify.listBlueprints();
  res.json(blueprints.slice(0, Number(req.query.limit) || 60));
}));

api.get('/printify/blueprints/:id/providers', wrap(async (req, res) =>
  res.json(await printify.listPrintProviders(req.params.id))));

api.get('/printify/blueprints/:id/providers/:providerId/variants', wrap(async (req, res) =>
  res.json(await printify.listVariants(req.params.id, req.params.providerId))));

api.get('/printify/products', wrap(async (req, res) => res.json(await printify.listProducts())));
