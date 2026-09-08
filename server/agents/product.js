import { askJson, profileContext, JSON_RULE } from '../lib/ai.js';
import { get, run, all, logEvent } from '../db.js';
import { hasAI, config } from '../config.js';
import { demoProductIdeas } from './demo.js';

const SYSTEM = `Sen bir print-on-demand ürün ve listing uzmanısın.
Bir niş verildiğinde satılabilir ürün konseptleri üretirsin.

Kurallar:
- Telif/marka ihlali yok: film, dizi, marka, sporcu, karakter isimleri veya sloganları kullanma.
  Ürün fikri jenerik, özgün ve satılabilir olmalı.
- design_brief bir tasarımcının (veya görsel üreten bir modelin) uygulayabileceği netlikte olsun:
  renk, tipografi, kompozisyon, baskı alanı.
- image_prompt İngilizce, baskıya hazır PNG üretecek şekilde yazılsın (mockup değil, şeffaf zemin).
- listing_title ve listing_description hedef pazarın dilinde (İngilizce) olsun.
- tags: Etsy için 13'e kadar, çoğu uzun kuyruk (2-3 kelime).
- price_suggestion: tahmini baz maliyet ve marjı birlikte belirt.`;

const schemaHint = `JSON şeması:
{
  "ideas": [
    { "title": string, "blueprint": string, "design_brief": string, "image_prompt": string,
      "listing_title": string, "listing_description": string,
      "tags": string[], "price_suggestion": string }
  ]
}`;

/** Bir niş için ürün fikri + hazır listing metni üretir. */
export async function generateIdeas(nicheId, count = 3) {
  const niche = get('SELECT * FROM niches WHERE id = ?', nicheId);
  if (!niche) throw new Error(`Niş bulunamadı: ${nicheId}`);

  const prompt = [
    profileContext(),
    '',
    `Niş: ${niche.name}`,
    `Hedef kitle: ${niche.audience || 'belirtilmedi'}`,
    `Neden bu niş: ${niche.rationale || 'belirtilmedi'}`,
    '',
    `Bu niş için ${count} adet ürün konsepti üret.`,
    schemaHint,
    JSON_RULE,
  ].join('\n');

  const { data } = hasAI()
    ? await askJson(SYSTEM, prompt, { webSearch: false })
    : { data: demoProductIdeas(niche) };

  const created = [];
  for (const idea of (data.ideas ?? []).slice(0, count)) {
    const { lastInsertRowid } = run(
      `INSERT INTO product_ideas
       (niche_id, title, blueprint, design_brief, image_prompt, listing_title, listing_description, tags, price_suggestion, channel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      niche.id, idea.title, idea.blueprint ?? '', idea.design_brief ?? '', idea.image_prompt ?? '',
      idea.listing_title ?? idea.title, idea.listing_description ?? '',
      JSON.stringify(idea.tags ?? []), idea.price_suggestion ?? '',
      config.profile.channels[0] ?? 'etsy',
    );
    created.push(Number(lastInsertRowid));
  }

  logEvent('product', `${created.length} ürün fikri üretildi: ${niche.name}`, { nicheId, mode: hasAI() ? 'ai' : 'demo' });
  return all(`SELECT * FROM product_ideas WHERE id IN (${created.map(() => '?').join(',') || 'NULL'})`, ...created);
}
