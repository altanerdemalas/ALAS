/**
 * API maliyeti tahmini.
 *
 * Kâr hesabındaki gibi burada da her oran kaynağı ve doğrulama tarihiyle
 * tutulur; panelde de gösterilir. Bu bir tahmindir — kesin tutar her zaman
 * Anthropic konsolundaki faturadır.
 */

export const PRICING = {
  // $ / 1.000.000 token
  models: {
    'claude-opus-5': { input: 5, output: 25 },
    'claude-sonnet-5': { input: 2, output: 10 },
    'claude-haiku-4-5': { input: 1, output: 5 },
  },
  // $ / arama (web arama aracı)
  webSearch: 0.01,
  source: 'https://www.anthropic.com/pricing',
  verifiedAt: '2026-09',
};

/** Bilinmeyen model gelirse en pahalı varsayımla hesapla — sürpriz olmasın. */
const modelPricing = (model) => PRICING.models[model] ?? PRICING.models['claude-opus-5'];

export function estimateCost({ model, inputTokens = 0, outputTokens = 0, searches = 0 }) {
  const p = modelPricing(model);
  const tokenCost = (inputTokens / 1e6) * p.input + (outputTokens / 1e6) * p.output;
  const searchCost = searches * PRICING.webSearch;
  return round(tokenCost + searchCost, 4);
}

/**
 * Tur listesinden dönem toplamını çıkarır.
 * Demo turları (mode = 'demo') maliyet üretmez, sayıma girmez.
 */
export function summarize(runs) {
  const ucretli = runs.filter((r) => r.mode === 'ai');

  const total = ucretli.reduce(
    (acc, r) => {
      const cost = estimateCost({
        model: r.model,
        inputTokens: r.input_tokens,
        outputTokens: r.output_tokens,
        searches: r.web_searches,
      });
      return {
        runs: acc.runs + 1,
        inputTokens: acc.inputTokens + (r.input_tokens || 0),
        outputTokens: acc.outputTokens + (r.output_tokens || 0),
        searches: acc.searches + (r.web_searches || 0),
        cost: acc.cost + cost,
      };
    },
    { runs: 0, inputTokens: 0, outputTokens: 0, searches: 0, cost: 0 },
  );

  return {
    ...total,
    cost: round(total.cost, 2),
    averagePerRun: total.runs ? round(total.cost / total.runs, 3) : 0,
  };
}

const round = (value, digits) => Number((Number(value) || 0).toFixed(digits));
