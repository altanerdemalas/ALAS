import cron from 'node-cron';
import { config } from './config.js';
import { get, logEvent } from './db.js';
import { runResearchCycle } from './agents/research.js';
import { refreshActions } from './agents/coach.js';
import { autoRunsBlocked } from './lib/usage.js';

let task = null;

/** Otomatik tur: bütçe aşıldıysa hiç başlamaz. */
async function otomatikTur(sebep) {
  if (autoRunsBlocked()) {
    logEvent('cron', `Otomatik tur atlandı (aylık bütçe aşıldı) — ${sebep}`);
    return;
  }
  logEvent('cron', `Otomatik araştırma turu başladı — ${sebep}`);
  try {
    await runResearchCycle();
    await refreshActions();
  } catch (error) {
    logEvent('error', `Otomatik tur hatası: ${error.message}`);
  }
}

/**
 * Zamanlamayı config'e göre (yeniden) kurar. Panelden ayar değiştirildiğinde
 * de çağrılır, böylece yeniden başlatmaya gerek kalmaz.
 */
export function applySchedule() {
  task?.stop();
  task = null;

  if (config.research.cron === 'off') return { scheduled: false };

  if (!cron.validate(config.research.cron)) {
    logEvent('error', `Geçersiz zamanlama: ${config.research.cron} — otomatik tur kapalı.`);
    return { scheduled: false, invalid: true };
  }

  task = cron.schedule(config.research.cron, () => otomatikTur('zamanlanmış'));
  return { scheduled: true };
}

/**
 * Cron yalnızca sunucu o anda açıkken tetiklenir; ALAS ise uygulama
 * açıldığında başlar. Mac kapalıyken gelen turlar bu yüzden kaybolurdu —
 * açılışta gecikmiş tur varsa telafi ediyoruz.
 */
export function catchUpIfDue() {
  if (config.research.cron === 'off') return { due: false };

  const sonTur = get("SELECT started_at FROM runs WHERE status = 'done' ORDER BY id DESC LIMIT 1");
  const gecenSaat = sonTur
    ? (Date.now() - new Date(sonTur.started_at).getTime()) / 3_600_000
    : Infinity;

  if (gecenSaat < config.research.catchUpHours) return { due: false };

  // Sunucunun ayağa kalkmasını engellemesin diye kısa gecikmeyle.
  setTimeout(() => otomatikTur(sonTur ? 'kaçırılan tur telafisi' : 'ilk tur'), 3000);
  return { due: true };
}
