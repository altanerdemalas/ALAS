/**
 * Uçtan uca akış: araştırma → ders/bulgu/niş → ürün fikri → görev planı.
 * Demo modunda çalışır (API anahtarı gerekmez) ama kayıt, tekrar engeli ve
 * konu döngüsü mantığı canlı moddakiyle aynı kod yoludur.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workdir = mkdtempSync(join(tmpdir(), 'alas-test-'));
process.env.DB_FILE = join(workdir, 'test.db');
process.env.ALAS_ENV_FILE = join(workdir, '.env');
delete process.env.ANTHROPIC_API_KEY; // demo modu

let db, research, seed, product, coach;

before(async () => {
  db = await import('../server/db.js');
  research = await import('../server/agents/research.js');
  seed = await import('../server/seed.js');
  product = await import('../server/agents/product.js');
  coach = await import('../server/agents/coach.js');
  seed.seedTopics();
});

after(() => rmSync(workdir, { recursive: true, force: true }));

test('başlangıç müfredatı yüklenir', () => {
  const topics = research.listTopics();
  assert.equal(topics.length, 14);
  assert.ok(topics.every((t) => t.question.length > 20), 'her konunun gerçek bir sorusu olmalı');
});

test('gündem baştan sona ilerler: 14 tur = 14 farklı ders', async () => {
  for (let i = 0; i < 14; i++) {
    const topic = research.nextTopic();
    assert.ok(topic, `${i + 1}. turda sıradaki konu bulunmalı`);
    const result = await research.researchTopic(topic.id);
    assert.equal(result.mode, 'demo');
  }

  const lessons = db.all('SELECT title FROM lessons');
  assert.equal(lessons.length, 14, 'her konu kendi dersini üretmeli');
  assert.equal(new Set(lessons.map((l) => l.title)).size, 14, 'dersler birbirinin kopyası olmamalı');

  const unrun = db.all('SELECT title FROM topics WHERE last_run_at IS NULL');
  assert.deepEqual(unrun, [], 'hiçbir konu atlanmamalı');
});

test('hiçbir tur hata ile bitmez', () => {
  const failed = db.all("SELECT id, error FROM runs WHERE status != 'done'");
  assert.deepEqual(failed, [], 'başarısız tur olmamalı');
});

test('aynı konular tekrar araştırılınca kopya üretilmez', async () => {
  const before = db.get(`SELECT
    (SELECT COUNT(*) FROM lessons) AS lessons,
    (SELECT COUNT(*) FROM findings) AS findings,
    (SELECT COUNT(*) FROM niches) AS niches`);

  for (let i = 0; i < 14; i++) {
    await research.researchTopic(research.nextTopic().id);
  }

  const after = db.get(`SELECT
    (SELECT COUNT(*) FROM lessons) AS lessons,
    (SELECT COUNT(*) FROM findings) AS findings,
    (SELECT COUNT(*) FROM niches) AS niches`);

  assert.deepEqual(after, before, 'ikinci geçiş hiçbir yeni kayıt eklememeli');
});

test('niş skoru talep/marj ile artar, rekabetle azalır', () => {
  const iyi = research.nicheScore({ demand: 9, competition: 2, margin: 8 });
  const kotu = research.nicheScore({ demand: 3, competition: 9, margin: 3 });
  assert.ok(iyi > kotu, 'iyi niş daha yüksek skor almalı');
  assert.ok(iyi <= 10 && kotu >= 0, 'skor 0-10 aralığında kalmalı');

  // Aralık dışı değerler kırpılmalı, skoru bozmamalı.
  const kirpilmis = research.nicheScore({ demand: 99, competition: -5, margin: 50 });
  assert.ok(kirpilmis <= 10, `skor 10'u aşmamalı, aşan: ${kirpilmis}`);
});

test('nişten ürün fikri ve listing metni üretilir', async () => {
  const niche = db.get('SELECT * FROM niches LIMIT 1');
  assert.ok(niche, 'araştırmadan en az bir niş çıkmalı');

  const ideas = await product.generateIdeas(niche.id, 1);
  assert.equal(ideas.length, 1);

  const idea = ideas[0];
  for (const alan of ['title', 'design_brief', 'image_prompt', 'listing_title', 'listing_description']) {
    assert.ok(idea[alan]?.length > 10, `${alan} dolu olmalı`);
  }
  assert.ok(JSON.parse(idea.tags).length > 0, 'etiketler üretilmeli');
  assert.match(idea.image_prompt, /transparent background/, 'görsel prompt baskıya hazır dosya istemeli');
});

test('koç mevcut duruma göre görev üretir ve tekrar etmez', async () => {
  const first = await coach.refreshActions();
  assert.ok(first.length > 0, 'en az bir görev önerilmeli');

  const second = await coach.refreshActions();
  const titles = second.map((a) => a.title);
  assert.equal(new Set(titles).size, titles.length, 'açık görevler tekrarlanmamalı');
});

test('konu eklenince gündemin sonuna girer ve sırası gelir', async () => {
  db.run("INSERT INTO topics (title, question, track, priority) VALUES ('Yeni konu', 'Bu bir test sorusu mudur?', 'genel', 2)");
  const next = research.nextTopic();
  assert.equal(next.title, 'Yeni konu', 'hiç çalışmamış konu sıranın başına geçmeli');

  const result = await research.researchTopic(next.id);
  assert.equal(result.mode, 'demo');
  // İçeriği yazılmamış konu için dürüst bir ders döner, uydurma değil.
  const lesson = db.get("SELECT * FROM lessons WHERE title = 'Demo modunun sınırı'");
  assert.ok(lesson, 'bilinmeyen konuda demo sınırı dersi verilmeli');
});
