import { askJson, profileContext, JSON_RULE } from '../lib/ai.js';
import { all, run, logEvent } from '../db.js';
import { hasAI } from '../config.js';

const SYSTEM = `Sen bir print-on-demand iş koçusun. Kullanıcının mevcut durumuna bakıp
bugün atabileceği en değerli 3-5 somut adımı belirlersin.

Kurallar:
- Adımlar sıralı ve bağımlılıklarına göre olsun (önce ne, sonra ne).
- Her adım tek oturumda bitirilebilir büyüklükte olsun.
- Genel tavsiye ("araştır", "öğren") verme; ölçülebilir çıktı iste.
- Türkçe yaz.`;

/**
 * Bilgi tabanı + mevcut durumdan "sıradaki adımlar" listesi üretir.
 * Açık görevler tekrar üretilmez; bitmiş olanlar bağlam olarak verilir.
 */
export async function refreshActions() {
  const open = all("SELECT title FROM actions WHERE status IN ('acik','yapiliyor')");
  const done = all("SELECT title FROM actions WHERE status = 'bitti' ORDER BY id DESC LIMIT 10");
  const findings = all('SELECT title, summary FROM findings ORDER BY id DESC LIMIT 15');
  const lessons = all('SELECT title, status FROM lessons ORDER BY id DESC LIMIT 10');
  const niches = all('SELECT name, score, status FROM niches ORDER BY score DESC LIMIT 5');
  const ideas = all('SELECT title, status FROM product_ideas ORDER BY id DESC LIMIT 10');

  if (!hasAI()) {
    const fallback = fallbackActions({ niches, ideas, lessons });
    return persist(fallback.filter((a) => !open.some((o) => o.title === a.title)));
  }

  const prompt = [
    profileContext(),
    '',
    'Mevcut durum:',
    `- Tamamlanan görevler: ${done.map((d) => d.title).join(' | ') || 'yok'}`,
    `- Açık görevler: ${open.map((o) => o.title).join(' | ') || 'yok'}`,
    `- Öğrenilen bulgular: ${findings.map((f) => f.title).join(' | ') || 'yok'}`,
    `- Dersler: ${lessons.map((l) => `${l.title} (${l.status})`).join(' | ') || 'yok'}`,
    `- Niş adayları: ${niches.map((n) => `${n.name} (skor ${n.score}, ${n.status})`).join(' | ') || 'yok'}`,
    `- Ürün fikirleri: ${ideas.map((i) => `${i.title} (${i.status})`).join(' | ') || 'yok'}`,
    '',
    'Açık görevleri TEKRARLAMA. Bir sonraki 3-5 adımı üret.',
    'JSON şeması: { "actions": [ { "title": string, "detail": string, "effort": "kucuk"|"orta"|"buyuk" } ] }',
    JSON_RULE,
  ].join('\n');

  const { data } = await askJson(SYSTEM, prompt, { webSearch: false });
  const fresh = (data.actions ?? []).filter((a) => a.title && !open.some((o) => o.title === a.title));
  return persist(fresh);
}

function persist(actions) {
  for (const a of actions) {
    run(
      'INSERT INTO actions (title, detail, effort, source) VALUES (?, ?, ?, ?)',
      a.title, a.detail ?? '', a.effort ?? 'orta', hasAI() ? 'ajan' : 'demo',
    );
  }
  logEvent('coach', `${actions.length} yeni adım önerildi`);
  return all("SELECT * FROM actions WHERE status IN ('acik','yapiliyor') ORDER BY id DESC");
}

/** API anahtarı yokken durum makinesine göre mantıklı bir sonraki adım. */
function fallbackActions({ niches, ideas, lessons }) {
  const steps = [];
  if (lessons.some((l) => l.status === 'yeni')) {
    steps.push({ title: 'Okunmamış dersleri bitir', detail: 'Öğren sekmesindeki "yeni" durumundaki dersleri oku ve okundu işaretle.', effort: 'kucuk' });
  }
  if (!niches.length) {
    steps.push({ title: 'Niş araştırması çalıştır', detail: 'Araştır sekmesinden "pazar" izleğindeki bir konuyu çalıştır ve niş adaylarını üret.', effort: 'kucuk' });
  } else if (!ideas.length) {
    steps.push({ title: `"${niches[0].name}" nişi için ürün fikri üret`, detail: 'Nişler sekmesinde en yüksek skorlu nişte "Ürün fikri üret" butonuna bas.', effort: 'kucuk' });
  } else {
    steps.push({ title: 'İlk tasarımı üret ve numune sipariş et', detail: 'Ürün fikirlerinden birini seç, image_prompt ile görseli üret, Printify\'a yükle ve kendine numune sipariş et.', effort: 'orta' });
  }
  steps.push({ title: 'API anahtarlarını bağla', detail: '.env dosyasına ANTHROPIC_API_KEY ve PRINTIFY_API_TOKEN ekle; ajan canlı araştırma ve gerçek katalog verisine geçsin.', effort: 'kucuk' });
  return steps;
}
