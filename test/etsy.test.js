/** Etsy ölçümü: sahte API'ye karşı, anahtar ve kota harcamadan. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fakeServer } from './helpers.js';

let server, respond;

before(async () => {
  server = await fakeServer((req, res, body) => respond(req, res, body));
  process.env.ETSY_BASE_URL = server.url;
  process.env.ETSY_API_KEY = 'test-etsy-anahtari';
});

after(() => server.close());

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const listing = (dollars, favorers) => ({
  price: { amount: Math.round(dollars * 100), divisor: 100, currency_code: 'USD' },
  num_favorers: favorers,
});

test('anahtar kelime araması gerçek sayıları çıkarır', async () => {
  const { keywordStats } = await import('../server/integrations/etsy.js');
  let seen = null;
  respond = (req, res) => {
    seen = { url: req.url, key: req.headers['x-api-key'] };
    json(res, 200, {
      count: 12430,
      results: [listing(19.99, 5), listing(24.99, 40), listing(29.99, 120), listing(34.99, 0)],
    });
  };

  const stats = await keywordStats('funny cat shirt');

  assert.equal(seen.key, 'test-etsy-anahtari', 'anahtar başlıkta gitmeli');
  assert.match(seen.url, /keywords=funny\+cat\+shirt|keywords=funny%20cat%20shirt/);
  assert.equal(stats.totalListings, 12430, 'toplam listing sayısı ham veriden gelmeli');
  assert.equal(stats.sampleSize, 4);
  assert.equal(stats.price.median, 27.49);
  assert.equal(stats.price.min, 19.99);
  assert.equal(stats.price.max, 34.99);
  assert.equal(stats.favorites.median, 22.5);
  assert.equal(stats.favorites.zeroShare, 0.25);
});

test('rekabet skoru listing sayısıyla birlikte artar', async () => {
  const { competitionScore } = await import('../server/integrations/etsy.js');
  const az = competitionScore({ totalListings: 80 });
  const orta = competitionScore({ totalListings: 6000 });
  const cok = competitionScore({ totalListings: 300000 });

  assert.ok(az < orta && orta < cok, `sıralama bozuk: ${az}, ${orta}, ${cok}`);
  assert.ok(az >= 1 && cok <= 10, '0-10 aralığında kalmalı');
});

test('ilgi sinyali favori dağılımından okunur', async () => {
  const { interestSignal } = await import('../server/integrations/etsy.js');
  const guclu = interestSignal({ favorites: { median: 80, zeroShare: 0.05 }, sampleSize: 100 });
  const zayif = interestSignal({ favorites: { median: 2, zeroShare: 0.6 }, sampleSize: 100 });

  assert.equal(guclu.yorum, 'güçlü ilgi');
  assert.equal(zayif.yorum, 'zayıf ilgi');
  assert.equal(zayif.zeroSharePct, 60);
  assert.equal(interestSignal({ favorites: null, sampleSize: 0 }), null);
});

test('geçersiz anahtar anlaşılır hata verir', async () => {
  const { keywordStats } = await import('../server/integrations/etsy.js');
  respond = (req, res) => json(res, 403, { error: 'forbidden' });
  await assert.rejects(() => keywordStats('test'), /anahtarı kabul edilmedi/);
});

test('istek sınırı ayrı mesajla bildirilir', async () => {
  const { keywordStats } = await import('../server/integrations/etsy.js');
  respond = (req, res) => json(res, 429, { error: 'rate limited' });
  await assert.rejects(() => keywordStats('test'), /istek sınırına/);
});

test('sonuç boşsa çökmez', async () => {
  const { keywordStats } = await import('../server/integrations/etsy.js');
  respond = (req, res) => json(res, 200, { count: 0, results: [] });

  const stats = await keywordStats('çok nadir bir terim');
  assert.equal(stats.totalListings, 0);
  assert.equal(stats.price, null);
  assert.equal(stats.favorites, null);
});
