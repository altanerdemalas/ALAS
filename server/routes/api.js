import { Router } from 'express';
import { all, get, run, parseJson, logEvent } from '../db.js';
import { config, hasAI, hasPrintify, hasEtsy } from '../config.js';
import { listTopics, researchTopic, runResearchCycle, nextTopic } from '../agents/research.js';
import { generateIdeas } from '../agents/product.js';
import { refreshActions } from '../agents/coach.js';
import * as printify from '../integrations/printify.js';
import * as etsy from '../integrations/etsy.js';
import { measureNiche } from '../agents/measure.js';
import { calculateMargin, priceForMargin, CHANNEL_FEES, centsToDollars } from '../lib/margin.js';
import { setEnvValue, maskSecret } from '../lib/env.js';
import { usageSummary } from '../lib/usage.js';
import { applySchedule } from '../scheduler.js';
import { resetClient } from '../lib/ai.js';

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
    etsy: { connected: hasEtsy() },
    profile: config.profile,
    research: { cron: config.research.cron, next: nextTopic() },
    recentEvents: all('SELECT * FROM events ORDER BY id DESC LIMIT 12'),
  });
});

// ---------------------------------------------------------------- harcama

api.get('/usage', (req, res) => res.json(usageSummary()));

/** Otomasyon ayarları — panelden değiştirilir, yeniden başlatma gerekmez. */
api.get('/automation', (req, res) => res.json({
  cron: config.research.cron,
  topicsPerRun: config.research.topicsPerRun,
  monthlyBudget: config.research.monthlyBudget,
  catchUpHours: config.research.catchUpHours,
}));

api.post('/automation', (req, res) => {
  const { cron: yeniCron, topicsPerRun, monthlyBudget } = req.body ?? {};

  if (typeof yeniCron === 'string') {
    const deger = yeniCron.trim() || 'off';
    if (deger !== 'off' && !cronGecerli(deger)) {
      return res.status(400).json({ error: `Geçersiz zamanlama: "${deger}"` });
    }
    setEnvValue('RESEARCH_CRON', deger);
    config.research.cron = deger;
    applySchedule(); // yeni zamanlama hemen geçerli olsun
  }

  if (topicsPerRun !== undefined) {
    const sayi = Math.max(1, Math.min(5, Number(topicsPerRun) || 1));
    setEnvValue('TOPICS_PER_RUN', String(sayi));
    config.research.topicsPerRun = sayi;
  }

  if (monthlyBudget !== undefined) {
    const butce = Math.max(0, Number(monthlyBudget) || 0);
    setEnvValue('MONTHLY_BUDGET_USD', String(butce));
    config.research.monthlyBudget = butce;
  }

  logEvent('settings', 'Otomasyon ayarları güncellendi', {
    cron: config.research.cron,
    topicsPerRun: config.research.topicsPerRun,
    monthlyBudget: config.research.monthlyBudget,
  });

  res.json({
    cron: config.research.cron,
    topicsPerRun: config.research.topicsPerRun,
    monthlyBudget: config.research.monthlyBudget,
  });
});

/** node-cron'un kendi doğrulayıcısı; hatalı ifade sessizce kaydedilmesin. */
const cronGecerli = (ifade) => ifade.trim().split(/\s+/).length === 5;

// ------------------------------------------------------------- anahtarlar

// Anahtarlar .env dosyasında tutulur. Sunucu yalnızca 127.0.0.1'i dinlediği
// için bu uçlara sadece bu bilgisayardan erişilebilir; değer hiçbir zaman
// maskesiz geri döndürülmez.

api.get('/settings/keys', (req, res) => {
  res.json({
    anthropic: { set: Boolean(config.anthropic.apiKey), masked: maskSecret(config.anthropic.apiKey) },
    printify: { set: Boolean(config.printify.token), masked: maskSecret(config.printify.token) },
    etsy: { set: Boolean(config.etsy.apiKey), masked: maskSecret(config.etsy.apiKey) },
    shopId: config.printify.shopId || '',
  });
});

api.post('/settings/keys', (req, res) => {
  const { anthropicKey, printifyToken, etsyKey, shopId } = req.body ?? {};
  const updated = [];

  if (typeof anthropicKey === 'string' && anthropicKey.trim()) {
    const key = anthropicKey.trim();
    if (!key.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Anthropic anahtarı "sk-ant-" ile başlamalı. Anahtarın tamamını kopyaladığından emin ol.' });
    }
    setEnvValue('ANTHROPIC_API_KEY', key);
    config.anthropic.apiKey = key;
    resetClient();
    updated.push('Anthropic');
  }

  if (typeof printifyToken === 'string' && printifyToken.trim()) {
    const token = printifyToken.trim();
    setEnvValue('PRINTIFY_API_TOKEN', token);
    config.printify.token = token;
    updated.push('Printify');
  }

  if (typeof etsyKey === 'string' && etsyKey.trim()) {
    const key = etsyKey.trim();
    setEnvValue('ETSY_API_KEY', key);
    config.etsy.apiKey = key;
    updated.push('Etsy');
  }

  if (typeof shopId === 'string') {
    setEnvValue('PRINTIFY_SHOP_ID', shopId.trim());
    config.printify.shopId = shopId.trim();
  }

  logEvent('settings', `Anahtar güncellendi: ${updated.join(', ') || 'mağaza ID'}`);
  res.json({ ok: true, updated });
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

api.get('/niches', (req, res) =>
  res.json(
    all('SELECT * FROM niches ORDER BY score DESC, id DESC')
      .map((n) => ({ ...n, measured: parseJson(n.measured, null) })),
  ));

// Tahmini rekabet skorunu Etsy'den ölçülen gerçek veriyle değiştirir.
api.post('/niches/:id/measure', wrap(async (req, res) => {
  const updated = await measureNiche(Number(req.params.id), { keyword: req.body?.keyword });
  res.json({ ...updated, measured: typeof updated.measured === 'string' ? parseJson(updated.measured, null) : updated.measured });
}));

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

// ------------------------------------------------------------ kâr hesabı

api.get('/margin/channels', (req, res) => res.json(CHANNEL_FEES));

api.post('/margin/calc', (req, res) => {
  const { basePrice, shippingCost, salePrice, shippingCharged, channel, adRate, returnRate, targetMarginPct } = req.body ?? {};
  if (!(Number(basePrice) > 0)) return res.status(400).json({ error: 'basePrice zorunlu' });

  const input = {
    basePrice: Number(basePrice),
    shippingCost: Number(shippingCost) || 0,
    shippingCharged: Number(shippingCharged) || 0,
    channel: channel || 'etsy',
    adRate: Number(adRate) || 0,
    returnRate: returnRate === undefined ? 0.02 : Number(returnRate),
  };

  res.json({
    ...(Number(salePrice) > 0 ? calculateMargin({ ...input, salePrice: Number(salePrice) }) : {}),
    suggestedPrice: priceForMargin({ ...input, targetMarginPct: Number(targetMarginPct) || 30 }),
  });
});

// -------------------------------------------------------------- etsy

api.get('/etsy/status', wrap(async (req, res) => res.json(await etsy.connectionStatus())));

api.get('/etsy/keyword', wrap(async (req, res) => {
  const keyword = String(req.query.q || '').trim();
  if (!keyword) return res.status(400).json({ error: 'q parametresi zorunlu' });
  res.json(await etsy.keywordStats(keyword));
}));

// -------------------------------------------------------------- printify

api.get('/printify/status', wrap(async (req, res) => res.json(await printify.connectionStatus())));

api.get('/printify/blueprints', wrap(async (req, res) => {
  const blueprints = await printify.listBlueprints();
  res.json(blueprints.slice(0, Number(req.query.limit) || 60));
}));

api.get('/printify/blueprints/:id/providers', wrap(async (req, res) =>
  res.json(await printify.listPrintProviders(req.params.id))));

api.get('/printify/blueprints/:id/providers/:providerId/variants', wrap(async (req, res) => {
  const data = await printify.listVariants(req.params.id, req.params.providerId);
  // Printify sent cinsinden döner; panelde dolar göstermek için çeviriyoruz.
  const variants = (data.variants ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    options: v.options,
    basePrice: centsToDollars(v.price ?? v.cost),
  }));
  res.json({ ...data, variants });
}));

api.get('/printify/products', wrap(async (req, res) => res.json(await printify.listProducts())));
