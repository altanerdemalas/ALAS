import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

mkdirSync(dirname(config.dbFile), { recursive: true });

export const db = new DatabaseSync(config.dbFile);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Araştırma gündemi: ajanın sırayla çalıştığı konu kuyruğu
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  track TEXT NOT NULL DEFAULT 'genel',      -- pazar | urun | tasarim | seo | operasyon | genel
  priority INTEGER NOT NULL DEFAULT 3,      -- 1 = en yüksek
  active INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Her araştırma çalıştırması
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running',   -- running | done | error
  mode TEXT NOT NULL DEFAULT 'ai',          -- ai | demo
  model TEXT,
  error TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

-- Araştırmadan çıkan ham bulgular (bilgi tabanı)
CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT,
  category TEXT,
  confidence TEXT DEFAULT 'orta',           -- dusuk | orta | yuksek
  sources TEXT DEFAULT '[]',                -- JSON dizi
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sana öğretilecek dersler (müfredat)
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  track TEXT NOT NULL DEFAULT 'genel',
  level INTEGER NOT NULL DEFAULT 1,         -- 1 temel, 2 orta, 3 ileri
  summary TEXT NOT NULL,
  body_md TEXT NOT NULL,
  action_items TEXT DEFAULT '[]',           -- JSON dizi
  sources TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'yeni',      -- yeni | okundu | uygulandi
  origin TEXT NOT NULL DEFAULT 'seed',      -- seed | research
  run_id INTEGER REFERENCES runs(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Niş fikirleri ve skorları
CREATE TABLE IF NOT EXISTS niches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  audience TEXT,
  rationale TEXT,
  demand INTEGER DEFAULT 0,                 -- 0-10
  competition INTEGER DEFAULT 0,            -- 0-10 (düşük iyi)
  margin INTEGER DEFAULT 0,                 -- 0-10
  seasonality TEXT,
  score REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'fikir',     -- fikir | test | aktif | elendi
  run_id INTEGER REFERENCES runs(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ürün fikirleri: tasarım brief'i + hazır listing metni
CREATE TABLE IF NOT EXISTS product_ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  niche_id INTEGER REFERENCES niches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  blueprint TEXT,                           -- ör. "Unisex Heavy Cotton Tee (Gildan 5000)"
  design_brief TEXT,
  image_prompt TEXT,
  listing_title TEXT,
  listing_description TEXT,
  tags TEXT DEFAULT '[]',
  price_suggestion TEXT,
  channel TEXT,
  status TEXT NOT NULL DEFAULT 'taslak',    -- taslak | onaylandi | yuklendi | elendi
  printify_product_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sıradaki adımlar (ajanın sana verdiği görevler)
CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  detail TEXT,
  effort TEXT DEFAULT 'orta',               -- kucuk | orta | buyuk
  status TEXT NOT NULL DEFAULT 'acik',      -- acik | yapiliyor | bitti | iptal
  source TEXT DEFAULT 'ajan',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Aktivite kaydı
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  meta TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_findings_run ON findings(run_id);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_ideas_niche ON product_ideas(niche_id);
`);

// Eski sürümler aynı konu tekrar araştırıldığında kopya kayıt üretiyordu.
// Açılışta her başlıktan yalnızca ilk kaydı bırakıp kalanları temizliyoruz;
// tekrarın kaynağı agents/research.js içinde ayrıca kapatıldı.
db.exec(`
DELETE FROM findings WHERE id NOT IN (SELECT MIN(id) FROM findings GROUP BY title);
DELETE FROM lessons  WHERE id NOT IN (SELECT MIN(id) FROM lessons  GROUP BY title);
DELETE FROM niches   WHERE id NOT IN (SELECT MIN(id) FROM niches   GROUP BY name);
DELETE FROM actions  WHERE id NOT IN (SELECT MIN(id) FROM actions  GROUP BY title);
DELETE FROM product_ideas WHERE id NOT IN (SELECT MIN(id) FROM product_ideas GROUP BY title);
`);

// Aynı başlık bir daha hiç girmesin diye veritabanı seviyesinde de kilitliyoruz.
db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_findings_title ON findings(title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_title  ON lessons(title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_niches_name    ON niches(name);
`);

/** SELECT — satır dizisi döndürür (null-prototype objeleri düzleştirir). */
export const all = (sql, ...params) =>
  db.prepare(sql).all(...params).map((row) => ({ ...row }));

/** SELECT — tek satır ya da null. */
export const get = (sql, ...params) => {
  const row = db.prepare(sql).get(...params);
  return row ? { ...row } : null;
};

/** INSERT/UPDATE/DELETE — { changes, lastInsertRowid }. */
export const run = (sql, ...params) => db.prepare(sql).run(...params);

export const logEvent = (type, message, meta = {}) =>
  run('INSERT INTO events (type, message, meta) VALUES (?, ?, ?)', type, message, JSON.stringify(meta));

/** JSON sütunlarını güvenli parse et. */
export const parseJson = (value, fallback = []) => {
  try {
    return JSON.parse(value ?? '');
  } catch {
    return fallback;
  }
};
