import { askJson, profileContext, JSON_RULE } from '../lib/ai.js';
import { all, get, run, logEvent } from '../db.js';
import { hasAI, config } from '../config.js';
import { demoResearch } from './demo.js';

const SYSTEM = `Sen bir print-on-demand (Printify) e-ticaret araştırma analistisin.
Görevin: verilen soruyu güncel kaynaklarla araştırmak, bulguları doğrulanabilir ve
uygulanabilir hale getirmek, sonra kullanıcıya bunu öğretecek kısa bir ders yazmak.

Kurallar:
- Uydurma yapma. Emin olmadığın veriyi "confidence": "dusuk" ile işaretle.
- Somut ol: rakam, komisyon oranı, ücret, ölçü, adım adım süreç ver.
- Fiyat/komisyon gibi değişken bilgilerde tarih belirt ve kaynak göster.
- Ders (lesson) yeni başlayan birine öğretir gibi, Türkçe ve sade yazılsın.
- action_items maddeleri kullanıcının bugün yapabileceği somut adımlar olsun.`;

const schemaHint = `JSON şeması:
{
  "findings": [
    { "title": string, "summary": string (1-2 cümle), "detail": string (markdown, 3-8 cümle),
      "category": string, "confidence": "dusuk"|"orta"|"yuksek" }
  ],
  "lesson": {
    "title": string, "level": 1|2|3, "summary": string,
    "body_md": string (markdown ders metni, 200-500 kelime),
    "action_items": string[]
  },
  "niches": [
    { "name": string, "audience": string, "rationale": string,
      "demand": 0-10, "competition": 0-10 (düşük = az rakip = iyi),
      "margin": 0-10, "seasonality": string }
  ],
  "next_questions": string[]
}
"niches" alanı sadece soru niş/pazar ile ilgiliyse doldurulsun, değilse boş dizi.`;

/** Sıradaki konuyu seç: aktif, en yüksek öncelikli, en uzun süredir çalışmamış. */
export function nextTopic() {
  return get(`
    SELECT * FROM topics
    WHERE active = 1
    ORDER BY priority ASC, COALESCE(last_run_at, '0000') ASC, id ASC
    LIMIT 1
  `);
}

/**
 * Bir konuyu araştırır: bulguları, dersi ve niş adaylarını veritabanına yazar.
 * API anahtarı yoksa demo içerikle aynı akışı çalıştırır — panel boş kalmaz.
 */
export async function researchTopic(topicId) {
  const topic = get('SELECT * FROM topics WHERE id = ?', topicId);
  if (!topic) throw new Error(`Konu bulunamadı: ${topicId}`);

  const mode = hasAI() ? 'ai' : 'demo';
  const { lastInsertRowid: runId } = run(
    'INSERT INTO runs (topic_id, mode, model) VALUES (?, ?, ?)',
    topic.id,
    mode,
    mode === 'ai' ? config.anthropic.model : 'demo',
  );

  try {
    const prompt = [
      profileContext(),
      '',
      `Araştırma konusu: ${topic.title}`,
      `Cevaplanacak soru: ${topic.question}`,
      `İzlek: ${topic.track}`,
      '',
      'Güncel kaynakları araştır (web arama aracını kullan), sonra şu formatta yanıt ver.',
      schemaHint,
      JSON_RULE,
    ].join('\n');

    const { data, sources, usage } =
      mode === 'ai'
        ? await askJson(SYSTEM, prompt, { webSearch: true })
        : demoRun(topic);

    persist(runId, data, sources);

    run(
      `UPDATE runs SET status = 'done', finished_at = datetime('now'),
       input_tokens = ?, output_tokens = ? WHERE id = ?`,
      usage.input_tokens,
      usage.output_tokens,
      runId,
    );
    run("UPDATE topics SET last_run_at = datetime('now') WHERE id = ?", topic.id);

    const counts = {
      findings: data.findings?.length ?? 0,
      niches: data.niches?.length ?? 0,
      lesson: data.lesson ? 1 : 0,
    };
    logEvent('research', `Araştırma tamamlandı: ${topic.title}`, { runId, mode, ...counts });
    return { runId, mode, ...counts };
  } catch (error) {
    run("UPDATE runs SET status = 'error', error = ?, finished_at = datetime('now') WHERE id = ?", String(error.message), runId);
    logEvent('error', `Araştırma başarısız: ${topic.title} — ${error.message}`, { runId });
    throw error;
  }
}

function persist(runId, data, sources) {
  const sourceJson = JSON.stringify(sources ?? []);

  for (const f of data.findings ?? []) {
    run(
      'INSERT INTO findings (run_id, title, summary, detail, category, confidence, sources) VALUES (?, ?, ?, ?, ?, ?, ?)',
      runId, f.title, f.summary, f.detail ?? '', f.category ?? null, f.confidence ?? 'orta', sourceJson,
    );
  }

  if (data.lesson?.title) {
    const l = data.lesson;
    run(
      `INSERT INTO lessons (title, track, level, summary, body_md, action_items, sources, origin, run_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'research', ?)`,
      l.title, data.track ?? 'genel', l.level ?? 1, l.summary ?? '', l.body_md ?? '',
      JSON.stringify(l.action_items ?? []), sourceJson, runId,
    );
  }

  for (const n of data.niches ?? []) {
    run(
      `INSERT INTO niches (name, audience, rationale, demand, competition, margin, seasonality, score, run_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      n.name, n.audience ?? '', n.rationale ?? '',
      clamp(n.demand), clamp(n.competition), clamp(n.margin), n.seasonality ?? '',
      nicheScore(n), runId,
    );
  }

  // Modelin önerdiği takip soruları gündeme düşük öncelikli konu olarak eklenir:
  // ajanın "kendi kendine öğrenme" döngüsü budur.
  for (const q of data.next_questions ?? []) {
    const exists = get('SELECT id FROM topics WHERE question = ?', q);
    if (!exists) {
      run(
        "INSERT INTO topics (title, question, track, priority) VALUES (?, ?, 'genel', 4)",
        q.length > 70 ? `${q.slice(0, 67)}...` : q,
        q,
      );
    }
  }
}

/** Demo modunu askJson ile aynı şekle sokar: { data, sources, usage }. */
function demoRun(topic) {
  const { sources, ...data } = demoResearch(topic);
  return { data, sources, usage: { input_tokens: 0, output_tokens: 0 } };
}

const clamp = (v) => Math.max(0, Math.min(10, Number(v) || 0));

/** Talep ve marj artı, rekabet eksi yönlü. 0-10 arası tek skor. */
export function nicheScore(n) {
  const demand = clamp(n.demand);
  const margin = clamp(n.margin);
  const competition = clamp(n.competition);
  return Number((demand * 0.45 + margin * 0.3 + (10 - competition) * 0.25).toFixed(2));
}

/** Zamanlanmış tur: gündemden birkaç konuyu sırayla işler. */
export async function runResearchCycle(count = config.research.topicsPerRun) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const topic = nextTopic();
    if (!topic) break;
    try {
      results.push(await researchTopic(topic.id));
    } catch (error) {
      results.push({ error: error.message, topic: topic.title });
    }
  }
  return results;
}

export const listTopics = () => all('SELECT * FROM topics ORDER BY active DESC, priority ASC, id ASC');
