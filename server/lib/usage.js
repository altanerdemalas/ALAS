import { all } from '../db.js';
import { config } from '../config.js';
import { summarize, PRICING } from './cost.js';

/** Bu ayın ilk günü (UTC) — turlar UTC damgasıyla saklanıyor. */
const ayBasi = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
};

/** Panel ve bütçe kontrolü için harcama özeti. */
export function usageSummary() {
  const buAy = summarize(all("SELECT * FROM runs WHERE started_at >= ? AND status = 'done'", ayBasi()));
  const tumZaman = summarize(all("SELECT * FROM runs WHERE status = 'done'"));

  const budget = config.research.monthlyBudget;
  return {
    month: buAy,
    allTime: tumZaman,
    budget: budget > 0
      ? {
          limit: budget,
          used: buAy.cost,
          remaining: Number(Math.max(0, budget - buAy.cost).toFixed(2)),
          exceeded: buAy.cost >= budget,
          usedPct: Math.min(100, Math.round((buAy.cost / budget) * 100)),
        }
      : null,
    pricing: PRICING,
  };
}

/**
 * Otomatik turlar bütçe aşılınca durur. Elle çalıştırma engellenmez:
 * kullanıcı bilerek tıklıyorsa kararı ona bırakıyoruz, panel uyarıyor.
 */
export const autoRunsBlocked = () => Boolean(usageSummary().budget?.exceeded);
