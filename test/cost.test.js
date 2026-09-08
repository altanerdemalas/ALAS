/** Maliyet tahmini ve aylık bütçe koruması. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { estimateCost, summarize, PRICING } from '../server/lib/cost.js';

test('token maliyeti fiyat tablosundan hesaplanır', () => {
  // 1M girdi + 1M çıktı, Opus 5: 5 + 25 = 30 dolar
  assert.equal(estimateCost({ model: 'claude-opus-5', inputTokens: 1e6, outputTokens: 1e6 }), 30);
  // Sonnet 5 daha ucuz olmalı
  assert.ok(
    estimateCost({ model: 'claude-sonnet-5', inputTokens: 1e6, outputTokens: 1e6 })
    < estimateCost({ model: 'claude-opus-5', inputTokens: 1e6, outputTokens: 1e6 }),
  );
});

test('web araması ayrıca ücretlendirilir', () => {
  const aramasiz = estimateCost({ model: 'claude-opus-5', inputTokens: 1000, outputTokens: 100 });
  const aramali = estimateCost({ model: 'claude-opus-5', inputTokens: 1000, outputTokens: 100, searches: 10 });
  assert.equal(Number((aramali - aramasiz).toFixed(4)), 0.1, '10 arama = $0.10');
});

test('bilinmeyen model en pahalı varsayımla hesaplanır', () => {
  const bilinmeyen = estimateCost({ model: 'gelecekteki-model', inputTokens: 1e6, outputTokens: 0 });
  assert.equal(bilinmeyen, PRICING.models['claude-opus-5'].input, 'maliyet olduğundan az görünmemeli');
});

test('demo turları maliyete sayılmaz', () => {
  const ozet = summarize([
    { mode: 'demo', model: 'demo', input_tokens: 0, output_tokens: 0, web_searches: 0 },
    { mode: 'ai', model: 'claude-opus-5', input_tokens: 100000, output_tokens: 5000, web_searches: 4 },
  ]);
  assert.equal(ozet.runs, 1, 'yalnızca ücretli tur sayılmalı');
  assert.equal(ozet.searches, 4);
  assert.ok(ozet.cost > 0);
});

test('boş listede çökmez', () => {
  const ozet = summarize([]);
  assert.equal(ozet.runs, 0);
  assert.equal(ozet.cost, 0);
  assert.equal(ozet.averagePerRun, 0);
});

test('fiyatlar kaynak ve doğrulama tarihiyle saklanır', () => {
  assert.ok(PRICING.source.startsWith('http'));
  assert.match(PRICING.verifiedAt, /^\d{4}-\d{2}$/);
});

// --- bütçe koruması: gerçek veritabanı üzerinden ---

const workdir = mkdtempSync(join(tmpdir(), 'alas-cost-'));
process.env.DB_FILE = join(workdir, 'test.db');
process.env.ALAS_ENV_FILE = join(workdir, '.env');

let db, config, usage;

before(async () => {
  db = await import('../server/db.js');
  ({ config } = await import('../server/config.js'));
  usage = await import('../server/lib/usage.js');
});

after(() => rmSync(workdir, { recursive: true, force: true }));

const pahaliTurEkle = () =>
  db.run(
    `INSERT INTO runs (status, mode, model, input_tokens, output_tokens, web_searches, started_at)
     VALUES ('done', 'ai', 'claude-opus-5', 400000, 20000, 10, strftime('%Y-%m-%dT%H:%M:%SZ','now'))`,
  );

test('bütçe tanımlı değilse otomatik turlar engellenmez', () => {
  config.research.monthlyBudget = 0;
  pahaliTurEkle();
  assert.equal(usage.autoRunsBlocked(), false);
  assert.equal(usage.usageSummary().budget, null);
});

test('bütçe aşılınca otomatik turlar durur', () => {
  config.research.monthlyBudget = 1; // $1 sınır
  const ozet = usage.usageSummary();

  assert.ok(ozet.month.cost > 1, `bu ayın maliyeti sınırı aşmalı, çıkan: ${ozet.month.cost}`);
  assert.equal(ozet.budget.exceeded, true);
  assert.equal(ozet.budget.remaining, 0);
  assert.equal(usage.autoRunsBlocked(), true);
});

test('bütçe içindeyken kalan tutar doğru raporlanır', () => {
  config.research.monthlyBudget = 100;
  const b = usage.usageSummary().budget;
  assert.equal(b.exceeded, false);
  assert.equal(b.remaining, Number((100 - b.used).toFixed(2)));
  assert.ok(b.usedPct >= 0 && b.usedPct <= 100);
  assert.equal(usage.autoRunsBlocked(), false);
});
