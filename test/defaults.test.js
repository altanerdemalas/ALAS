/** Varsayılan göçü: bizim yazdığımız eski değerler düzelir, kullanıcınınki durur. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workdir = mkdtempSync(join(tmpdir(), 'alas-def-'));
const envFile = join(workdir, '.env');
process.env.DB_FILE = join(workdir, 'test.db');
process.env.ALAS_ENV_FILE = envFile;

let applyDefaultsOnce, config;

before(async () => {
  ({ config } = await import('../server/config.js'));
  ({ applyDefaultsOnce } = await import('../server/lib/defaults.js'));
});

after(() => rmSync(workdir, { recursive: true, force: true }));

beforeEach(() => {
  delete process.env.ALAS_DEFAULTS_V2;
  config.research.cron = '0 7 * * *';
  config.research.topicsPerRun = 2;
  config.research.monthlyBudget = 0;
});

test('eski varsayılanlar güvenli ayarlara çekilir', () => {
  writeFileSync(envFile, 'RESEARCH_CRON=0 7 * * *\nTOPICS_PER_RUN=2\nTARGET_MARKET=US\n');

  const sonuc = applyDefaultsOnce();
  const env = readFileSync(envFile, 'utf8');

  assert.equal(sonuc.migrated, true);
  assert.match(env, /RESEARCH_CRON=off/);
  assert.match(env, /TOPICS_PER_RUN=1/);
  assert.match(env, /MONTHLY_BUDGET_USD=10/);
  assert.equal(config.research.cron, 'off', 'çalışan sürece de uygulanmalı');
  assert.match(env, /TARGET_MARKET=US/, 'diğer ayarlar korunmalı');
});

test('kullanıcının kendi seçtiği değere dokunulmaz', () => {
  writeFileSync(envFile, 'RESEARCH_CRON=0 9 * * 1\nTOPICS_PER_RUN=4\nMONTHLY_BUDGET_USD=50\n');

  applyDefaultsOnce();
  const env = readFileSync(envFile, 'utf8');

  assert.match(env, /RESEARCH_CRON=0 9 \* \* 1/, 'özel zamanlama korunmalı');
  assert.match(env, /TOPICS_PER_RUN=4/, 'özel konu sayısı korunmalı');
  assert.match(env, /MONTHLY_BUDGET_USD=50/, 'özel bütçe korunmalı');
});

test('bir kez çalışır, sonraki açılışlarda ayarları geri almaz', () => {
  writeFileSync(envFile, 'RESEARCH_CRON=0 7 * * *\nTOPICS_PER_RUN=2\n');
  applyDefaultsOnce();

  // Kullanıcı göçten sonra otomatik turu bilerek açıyor.
  writeFileSync(readFileSync(envFile, 'utf8').includes('ALAS_DEFAULTS_V2') ? envFile : envFile,
    readFileSync(envFile, 'utf8').replace('RESEARCH_CRON=off', 'RESEARCH_CRON=0 7 * * *'));

  const ikinci = applyDefaultsOnce();
  assert.equal(ikinci.migrated, false, 'ikinci kez çalışmamalı');
  assert.match(readFileSync(envFile, 'utf8'), /RESEARCH_CRON=0 7 \* \* \*/, 'kullanıcının seçimi geri alınmamalı');
});
