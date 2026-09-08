import express from 'express';
import cron from 'node-cron';
import { existsSync } from 'node:fs';
import { config, hasAI, hasPrintify } from './config.js';
import { logEvent } from './db.js';
import { seedTopics } from './seed.js';
import { api } from './routes/api.js';
import { runResearchCycle } from './agents/research.js';
import { refreshActions } from './agents/coach.js';
import { autoRunsBlocked } from './lib/usage.js';
import { get } from './db.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/api', api);

// Production'da Vite çıktısını da bu sunucu servis eder.
if (existsSync('./dist')) {
  app.use(express.static('./dist'));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile('index.html', { root: './dist' }));
}

seedTopics();

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

if (config.research.cron !== 'off') {
  cron.schedule(config.research.cron, () => otomatikTur('zamanlanmış'));

  // Cron yalnızca sunucu o anda açıksa tetiklenir; ALAS ise kullanıcı
  // uygulamayı açtığında başlar. Bu yüzden Mac kapalıyken gelen turlar
  // sessizce kaybolurdu. Açılışta gecikmiş tur varsa telafi ediyoruz.
  const sonTur = get("SELECT started_at FROM runs WHERE status = 'done' ORDER BY id DESC LIMIT 1");
  const gecenSaat = sonTur
    ? (Date.now() - new Date(sonTur.started_at).getTime()) / 3_600_000
    : Infinity;

  if (gecenSaat >= config.research.catchUpHours) {
    // Sunucunun ayağa kalkmasını engellemesin diye kısa gecikmeyle başlat.
    setTimeout(() => otomatikTur(sonTur ? 'kaçırılan tur telafisi' : 'ilk tur'), 3000);
  }
}

// Yalnızca bu bilgisayardan erişilebilsin: panel API anahtarı yazabildiği için
// sunucuyu ağa açmıyoruz.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`ALAS POD ajanı → http://localhost:${config.port}`);
  console.log(`  AI       : ${hasAI() ? `bağlı (${config.anthropic.model})` : 'DEMO modu (ANTHROPIC_API_KEY yok)'}`);
  console.log(`  Printify : ${hasPrintify() ? 'bağlı' : 'bağlı değil (PRINTIFY_API_TOKEN yok)'}`);
  console.log(`  Araştırma: ${config.research.cron === 'off' ? 'kapalı' : `cron "${config.research.cron}"`}`);
});
