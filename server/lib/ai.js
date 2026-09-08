import Anthropic from '@anthropic-ai/sdk';
import { config, hasAI } from '../config.js';

let client = null;
const getClient = () => (client ??= new Anthropic({ apiKey: config.anthropic.apiKey }));

/** Anahtar panelden değiştirildiğinde istemciyi tazeler (yeniden başlatma gerekmez). */
export const resetClient = () => { client = null; };

/**
 * Modelden JSON isteyip parse eder. `webSearch` açıkken Anthropic'in sunucu
 * taraflı web arama aracı devreye girer; kaynak URL'lerini de toplarız.
 *
 * @returns {Promise<{data: any, sources: {title: string, url: string}[], usage: object}>}
 */
export async function askJson(system, prompt, { webSearch = false, maxUses = 8 } = {}) {
  if (!hasAI()) throw new Error('ANTHROPIC_API_KEY tanımlı değil — demo modunda çalışılıyor.');

  const tools = webSearch
    ? [{ type: 'web_search_20260209', name: 'web_search', max_uses: maxUses }]
    : undefined;

  let message;
  try {
    const stream = await getClient().messages.stream({
      model: config.anthropic.model,
      max_tokens: 32000,
      system,
      thinking: { type: 'adaptive' },
      output_config: { effort: config.anthropic.effort },
      ...(tools ? { tools } : {}),
      messages: [{ role: 'user', content: prompt }],
    });
    message = await stream.finalMessage();
  } catch (error) {
    throw new Error(aciklaHata(error));
  }

  if (message.stop_reason === 'refusal') {
    throw new Error(`Model isteği reddetti: ${message.stop_details?.explanation ?? 'sebep belirtilmedi'}`);
  }

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return {
    data: extractJson(text),
    sources: collectSources(message.content),
    usage: {
      input_tokens: message.usage?.input_tokens ?? 0,
      output_tokens: message.usage?.output_tokens ?? 0,
      // Web arama ayrı ücretlendirilir. API kendi sayacını veriyorsa onu
      // kullan; vermiyorsa dönen sonuç bloklarını say.
      web_searches:
        message.usage?.server_tool_use?.web_search_requests
        ?? message.content.filter((b) => b.type === 'web_search_tool_result').length,
    },
  };
}

/** Model bazen JSON'u ``` bloğuna sarar ya da önüne cümle koyar; ikisini de tolere et. */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate.trim());
  } catch {
    // İlk { ... } veya [ ... ] bloğunu yakalamayı dene.
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (start === -1 || end <= start) throw new Error(`Model JSON döndürmedi:\n${text.slice(0, 400)}`);
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

/** web_search sonuç bloklarından tekilleştirilmiş kaynak listesi çıkar. */
function collectSources(content) {
  const seen = new Map();
  for (const block of content) {
    if (block.type !== 'web_search_tool_result') continue;
    // Hata durumunda .content bir dizi değil, tek bir hata objesidir.
    if (!Array.isArray(block.content)) continue;
    for (const result of block.content) {
      if (result.url && !seen.has(result.url)) {
        seen.set(result.url, { title: result.title || result.url, url: result.url });
      }
    }
  }
  return [...seen.values()];
}

/**
 * API hatalarını ham JSON yerine ne yapılacağını söyleyen Türkçe mesaja çevirir.
 * Panelde kullanıcının gördüğü metin budur.
 */
function aciklaHata(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return 'API anahtarı geçersiz. Ayarlar sekmesinden anahtarı kontrol et; '
      + 'anahtarın tamamını kopyaladığından emin ol.';
  }

  if (error instanceof Anthropic.RateLimitError) {
    return 'Anthropic istek sınırına takıldın. Birkaç dakika bekleyip tekrar dene.';
  }

  if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) {
    return 'Anthropic hesabında kredi kalmamış. console.anthropic.com → Plans & Billing '
      + '→ Buy credits ile kredi yükle ($5 yeterli), sonra tekrar dene.';
  }

  if (error instanceof Anthropic.APIConnectionError) {
    return 'Anthropic sunucusuna ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
  }

  if (error instanceof Anthropic.APIError) {
    return error.status >= 500
      ? `Anthropic tarafında geçici bir sorun var (${error.status}). Biraz sonra tekrar dene.`
      : `Anthropic hatası (${error.status}): ${error.message}`;
  }

  return error.message;
}

/** Prompt'lara eklenen ortak kullanıcı profili bağlamı. */
export function profileContext() {
  const { channels, market, language, budget, experience } = config.profile;
  return [
    `Kullanıcı profili:`,
    `- Satış kanalları: ${channels.join(', ')}`,
    `- Hedef pazar: ${market}`,
    `- İçerik dili: ${language === 'tr' ? 'Türkçe (listing metinleri hedef pazarın dilinde)' : language}`,
    `- Başlangıç bütçesi: ${budget}`,
    `- Deneyim: ${experience}`,
    `- İş modeli: Printify ile print-on-demand (stoksuz) e-ticaret.`,
  ].join('\n');
}

export const JSON_RULE =
  'Yanıtın SADECE geçerli JSON olsun. Açıklama, markdown başlığı veya kod bloğu dışı metin ekleme.';
