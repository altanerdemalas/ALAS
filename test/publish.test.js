/** Ürün yayınlama akışı: sahte Printify'a karşı, gerçek rota üzerinden. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { fakeServer } from './helpers.js';

const workdir = mkdtempSync(join(tmpdir(), 'alas-pub-'));
process.env.DB_FILE = join(workdir, 'test.db');
process.env.ALAS_ENV_FILE = join(workdir, '.env');
process.env.PRINTIFY_API_TOKEN = 'test-token';
process.env.PRINTIFY_SHOP_ID = '42';

let base, server, printifyMock, db;
const istekler = [];

before(async () => {
  printifyMock = await fakeServer((req, res, body) => {
    istekler.push({ method: req.method, url: req.url, body: body ? JSON.parse(body) : null });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(
      req.url.includes('/uploads/images')
        ? { id: 'img_abc', file_name: 'design.png', preview_url: 'https://example.com/p.png' }
        : { id: 'prod_xyz' },
    ));
  });
  process.env.PRINTIFY_BASE_URL = printifyMock.url;

  db = await import('../server/db.js');
  const { api } = await import('../server/routes/api.js');
  const app = express();
  app.use(express.json({ limit: '32mb' }));
  app.use('/api', api);
  server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;

  db.run("INSERT INTO niches (name) VALUES ('Test nişi')");
  db.run(
    `INSERT INTO product_ideas (niche_id, title, listing_title, listing_description, tags)
     VALUES (1, 'Test ürünü', 'Funny Cat Mom Shirt, Gift for Cat Lovers', ?, ?)`,
    'x'.repeat(120),
    JSON.stringify(Array.from({ length: 13 }, (_, i) => `tag ${i}`)),
  );
});

after(async () => {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await printifyMock.close();
  rmSync(workdir, { recursive: true, force: true });
});

const post = (path, body) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('tasarım dosyası olmadan yayınlama reddedilir', async () => {
  const res = await post('/ideas/1/publish', { blueprintId: 384, printProviderId: 1, variants: [{ id: 1, price: 25 }] });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /Tasarım dosyası/);
});

test('varyant seçilmeden yayınlama reddedilir', async () => {
  const res = await post('/ideas/1/publish', { imageBase64: 'AAAA', blueprintId: 384, printProviderId: 1, variants: [] });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /varyant/i);
});

test('tasarım yüklenir, ürün oluşturulur, fikir işaretlenir', async () => {
  istekler.length = 0;
  const res = await post('/ideas/1/publish', {
    fileName: 'tasarim.png',
    imageBase64: 'QUJD',
    blueprintId: 384,
    printProviderId: 1,
    variants: [{ id: 45740, price: 24.99 }],
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.productId, 'prod_xyz');

  // Önce yükleme, sonra ürün oluşturma yapılmalı.
  assert.equal(istekler.length, 2);
  assert.match(istekler[0].url, /\/uploads\/images\.json$/);
  assert.equal(istekler[0].body.file_name, 'tasarim.png');
  assert.equal(istekler[0].body.contents, 'QUJD');

  assert.match(istekler[1].url, /\/shops\/42\/products\.json$/);
  assert.equal(istekler[1].body.blueprint_id, 384);
  assert.equal(istekler[1].body.variants[0].price, 2499, 'fiyat sent cinsinden gitmeli');
  assert.equal(istekler[1].body.print_areas[0].placeholders[0].images[0].id, 'img_abc', 'yüklenen görsel bağlanmalı');

  const idea = db.get('SELECT status, printify_product_id FROM product_ideas WHERE id = 1');
  assert.equal(idea.status, 'yuklendi');
  assert.equal(idea.printify_product_id, 'prod_xyz');
});

test('yayın öncesi kontrol Etsy olmadan da çalışır ve atlananları söyler', async () => {
  const res = await post('/ideas/1/preflight', { price: 24.99 });
  const data = await res.json();

  assert.equal(res.status, 200);
  const byId = Object.fromEntries(data.checks.map((c) => [c.id, c]));
  assert.equal(byId.telif.durum, 'gecti');
  assert.equal(byId.listing.durum, 'gecti');
  assert.equal(byId.talep.durum, 'atlandi', 'Etsy anahtarı yokken atlandı denmeli');
  assert.equal(byId.fiyat.durum, 'atlandi');
  assert.equal(data.sonuc, 'gecti');
});

test('olmayan ürün fikri 404 döner', async () => {
  const res = await post('/ideas/999/preflight', {});
  assert.equal(res.status, 404);
});
