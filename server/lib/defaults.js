import { readFileSync, existsSync } from 'node:fs';
import { setEnvValue, ENV_FILE } from './env.js';
import { config } from '../config.js';
import { logEvent } from '../db.js';

/**
 * Erken sürümler .env'e maliyetli varsayılanlar yazıyordu: her gün otomatik
 * tur, tur başına 2 konu, bütçe sınırı yok. Ölçünce bunun ayda ~$40 tuttuğu
 * görüldü, varsayılanlar güvenli tarafa çekildi.
 *
 * Bu göç yalnızca **bizim yazdığımız eski değerleri** düzeltir; kullanıcının
 * kendi seçtiği bir değer varsa dokunmaz. Bir kez çalışır ve panelde
 * görünecek şekilde kaydedilir.
 */
const MARKER = 'ALAS_DEFAULTS_V2';

const ESKI_VARSAYILANLAR = {
  RESEARCH_CRON: { eski: '0 7 * * *', yeni: 'off', alan: () => { config.research.cron = 'off'; } },
  TOPICS_PER_RUN: { eski: '2', yeni: '1', alan: () => { config.research.topicsPerRun = 1; } },
};

export function applyDefaultsOnce() {
  if (process.env[MARKER]) return { migrated: false };

  const mevcut = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  const degisen = [];

  for (const [key, kural] of Object.entries(ESKI_VARSAYILANLAR)) {
    const satir = mevcut.match(new RegExp(`^\\s*${key}\\s*=(.*)$`, 'm'));
    // Satır yoksa kod varsayılanı zaten yeni değer; sadece eski değeri düzeltiyoruz.
    if (satir && satir[1].trim() === kural.eski) {
      setEnvValue(key, kural.yeni);
      kural.alan();
      degisen.push(`${key}=${kural.yeni}`);
    }
  }

  // Bütçe hiç tanımlanmamışsa güvenli bir sınır koy.
  if (!/^\s*MONTHLY_BUDGET_USD\s*=/m.test(mevcut)) {
    setEnvValue('MONTHLY_BUDGET_USD', '10');
    config.research.monthlyBudget = 10;
    degisen.push('MONTHLY_BUDGET_USD=10');
  }

  setEnvValue(MARKER, '1');
  process.env[MARKER] = '1';

  if (degisen.length) {
    logEvent(
      'settings',
      `Varsayılanlar güvenli ayarlara çekildi: ${degisen.join(', ')}. Ayarlar sekmesinden değiştirebilirsin.`,
      { degisen },
    );
  }
  return { migrated: degisen.length > 0, degisen };
}
