/** Anahtar kaydetme: .env yazımı, maskeleme, doğrulama ve canlıya geçiş. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';

const workdir = mkdtempSync(join(tmpdir(), 'alas-keys-'));
const envFile = join(workdir, '.env');
process.env.DB_FILE = join(workdir, 'test.db');
process.env.ALAS_ENV_FILE = envFile;
delete process.env.ANTHROPIC_API_KEY;

let base, server, config;

before(async () => {
  // Gerçek .env'de olduğu gibi başka ayarlar da bulunsun.
  writeFileSync(envFile, '# yorum satırı\nRESEARCH_CRON=0 7 * * *\nTARGET_MARKET=US\n');

  ({ config } = await import('../server/config.js'));
  const { api } = await import('../server/routes/api.js');
  const app = express();
  app.use(express.json());
  app.use('/api', api);
  server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  rmSync(workdir, { recursive: true, force: true });
});

const post = (path, body) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('başlangıçta anahtar yok olarak raporlanır', async () => {
  const data = await (await fetch(`${base}/settings/keys`)).json();
  assert.equal(data.anthropic.set, false);
  assert.equal(data.anthropic.masked, null);
});

test('hatalı formatlı anahtar reddedilir ve dosyaya yazılmaz', async () => {
  const res = await post('/settings/keys', { anthropicKey: 'bu-bir-anahtar-degil' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /sk-ant-/);
  assert.doesNotMatch(readFileSync(envFile, 'utf8'), /bu-bir-anahtar-degil/, 'geçersiz değer .env\'e sızmamalı');
});

test('geçerli anahtar kaydedilir ve program yeniden başlatmadan canlıya geçer', async () => {
  const key = 'sk-ant-api03-test-anahtar-1234567890';
  const res = await post('/settings/keys', { anthropicKey: key });
  assert.equal(res.status, 200);

  assert.match(readFileSync(envFile, 'utf8'), new RegExp(`ANTHROPIC_API_KEY=${key}`), '.env dosyasına yazılmalı');
  assert.equal(config.anthropic.apiKey, key, 'çalışan sürece de uygulanmalı');

  const status = await (await fetch(`${base}/status`)).json();
  assert.equal(status.ai.connected, true, 'panel canlı modu göstermeli');
});

test('.env dosyasındaki diğer ayarlar korunur', () => {
  const content = readFileSync(envFile, 'utf8');
  assert.match(content, /RESEARCH_CRON=0 7 \* \* \*/);
  assert.match(content, /TARGET_MARKET=US/);
  assert.match(content, /# yorum satırı/);
});

test('anahtar geri okunurken maskelenir, tam değer sızmaz', async () => {
  const raw = await (await fetch(`${base}/settings/keys`)).text();
  assert.doesNotMatch(raw, /test-anahtar-1234567890/, 'tam anahtar yanıtta olmamalı');

  const data = JSON.parse(raw);
  assert.equal(data.anthropic.set, true);
  assert.match(data.anthropic.masked, /^sk-ant-…/);
});

test('anahtar güncellenince dosyada tek satır kalır, çoğalmaz', async () => {
  await post('/settings/keys', { anthropicKey: 'sk-ant-api03-ikinci-anahtar-0987654321' });
  const lines = readFileSync(envFile, 'utf8').split('\n').filter((l) => l.startsWith('ANTHROPIC_API_KEY='));
  assert.equal(lines.length, 1, 'her kayıtta yeni satır eklenmemeli');
  assert.match(lines[0], /ikinci-anahtar/);
});

test('mağaza ID kaydedilir', async () => {
  await post('/settings/keys', { shopId: '12345' });
  assert.equal(config.printify.shopId, '12345');
  assert.match(readFileSync(envFile, 'utf8'), /PRINTIFY_SHOP_ID=12345/);
});
