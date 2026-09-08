import express from 'express';
import { existsSync } from 'node:fs';
import { config, hasAI, hasPrintify } from './config.js';
import { seedTopics } from './seed.js';
import { api } from './routes/api.js';
import { applySchedule, catchUpIfDue } from './scheduler.js';
import { applyDefaultsOnce } from './lib/defaults.js';

const app = express();
// Tasarım dosyaları base64 olarak geldiği için gövde limiti yüksek tutuluyor
// (baskıya hazır PNG'ler büyük olur; base64 ayrıca ~%33 şişirir).
app.use(express.json({ limit: '32mb' }));
app.use('/api', api);

// Production'da Vite çıktısını da bu sunucu servis eder.
if (existsSync('./dist')) {
  app.use(express.static('./dist'));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile('index.html', { root: './dist' }));
}

seedTopics();
applyDefaultsOnce();
applySchedule();
catchUpIfDue();

app.listen(config.port, '127.0.0.1', () => {
  console.log(`ALAS POD ajanı → http://localhost:${config.port}`);
  console.log(`  AI       : ${hasAI() ? `bağlı (${config.anthropic.model})` : 'DEMO modu (ANTHROPIC_API_KEY yok)'}`);
  console.log(`  Printify : ${hasPrintify() ? 'bağlı' : 'bağlı değil (PRINTIFY_API_TOKEN yok)'}`);
  console.log(`  Araştırma: ${config.research.cron === 'off' ? 'kapalı' : `cron "${config.research.cron}"`}`);
});
