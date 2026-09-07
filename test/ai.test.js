/**
 * Yapay zeka yolu: gerçek Anthropic SDK'sı kullanılır, ama istekler sahte bir
 * sunucuya gider. Böylece API anahtarı ve para harcamadan; JSON ayrıştırma,
 * kaynak toplama, ret ve hata durumları gerçek kod yoluyla test edilir.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fakeServer, writeAnthropicStream, webSearchBlock } from './helpers.js';

process.env.ANTHROPIC_API_KEY = 'sk-ant-test-anahtar';

let server;
let respond; // her test kendi yanıtını belirler

before(async () => {
  server = await fakeServer((req, res, body) => respond(req, res, body));
  process.env.ANTHROPIC_BASE_URL = server.url;
});

after(() => server.close());

const load = async () => {
  const { askJson } = await import('../server/lib/ai.js');
  return askJson;
};

test('düz JSON yanıtı ayrıştırılır ve token sayıları okunur', async () => {
  const askJson = await load();
  respond = (req, res) =>
    writeAnthropicStream(res, { blocks: [{ type: 'text', text: '{"findings":[{"title":"Test bulgusu"}]}' }] });

  const { data, usage } = await askJson('sistem', 'soru');
  assert.equal(data.findings[0].title, 'Test bulgusu');
  assert.equal(usage.input_tokens, 1234);
  assert.equal(usage.output_tokens, 567);
});

test('kod bloğuna sarılmış JSON ayrıştırılır', async () => {
  const askJson = await load();
  respond = (req, res) =>
    writeAnthropicStream(res, {
      blocks: [{ type: 'text', text: 'İşte sonuç:\n```json\n{"lesson":{"title":"Ders"}}\n```\nUmarım yardımcı olur.' }],
    });

  const { data } = await askJson('sistem', 'soru');
  assert.equal(data.lesson.title, 'Ders');
});

test('JSON öncesi/sonrası serbest metin tolere edilir', async () => {
  const askJson = await load();
  respond = (req, res) =>
    writeAnthropicStream(res, { blocks: [{ type: 'text', text: 'Araştırmayı yaptım. {"niches":[{"name":"Niş"}]} Bitti.' }] });

  const { data } = await askJson('sistem', 'soru');
  assert.equal(data.niches[0].name, 'Niş');
});

test('web araması kaynakları toplanır ve tekilleştirilir', async () => {
  const askJson = await load();
  respond = (req, res) =>
    writeAnthropicStream(res, {
      blocks: [
        webSearchBlock([
          { url: 'https://a.com/x', title: 'A sayfası' },
          { url: 'https://b.com/y', title: 'B sayfası' },
        ]),
        webSearchBlock([{ url: 'https://a.com/x', title: 'A sayfası (tekrar)' }]),
        { type: 'text', text: '{"ok":true}' },
      ],
    });

  const { sources } = await askJson('sistem', 'soru', { webSearch: true });
  assert.equal(sources.length, 2, 'aynı URL iki kez sayılmamalı');
  assert.deepEqual(sources.map((s) => s.url), ['https://a.com/x', 'https://b.com/y']);
});

test('web arama aracı hata döndürdüğünde çökmez', async () => {
  const askJson = await load();
  respond = (req, res) =>
    writeAnthropicStream(res, {
      blocks: [
        // Hata durumunda .content bir dizi değil, tek bir obje olur.
        { type: 'web_search_tool_result', tool_use_id: 'x', content: { type: 'web_search_tool_result_error', error_code: 'max_uses_exceeded' } },
        { type: 'text', text: '{"ok":true}' },
      ],
    });

  const { data, sources } = await askJson('sistem', 'soru', { webSearch: true });
  assert.equal(data.ok, true);
  assert.deepEqual(sources, []);
});

test('model reddederse anlaşılır hata verilir', async () => {
  const askJson = await load();
  respond = (req, res) =>
    writeAnthropicStream(res, {
      blocks: [{ type: 'text', text: '' }],
      stopReason: 'refusal',
      stopDetails: { type: 'refusal', category: 'other', explanation: 'test sebebi' },
    });

  await assert.rejects(() => askJson('sistem', 'soru'), /reddetti/);
});

test('JSON olmayan yanıt sessizce yutulmaz', async () => {
  const askJson = await load();
  respond = (req, res) =>
    writeAnthropicStream(res, { blocks: [{ type: 'text', text: 'Bu bir JSON değil, sadece düz metin.' }] });

  await assert.rejects(() => askJson('sistem', 'soru'), /JSON döndürmedi/);
});

test('API hatası (401) yukarı taşınır', async () => {
  const askJson = await load();
  respond = (req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }));
  };

  await assert.rejects(() => askJson('sistem', 'soru'));
});
