/** Printify istemcisi: sahte API sunucusuna karşı, token harcamadan. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fakeServer } from './helpers.js';

let server;
let respond;

before(async () => {
  server = await fakeServer((req, res, body) => respond(req, res, body));
  process.env.PRINTIFY_BASE_URL = server.url;
  process.env.PRINTIFY_API_TOKEN = 'test-token';
  process.env.PRINTIFY_SHOP_ID = '42';
});

after(() => server.close());

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

test('token yokken açıklayıcı hata verir, sessizce geçmez', async () => {
  // config .env'i açılışta bir kez okur; testte doğrudan alanı değiştiriyoruz.
  const { config } = await import('../server/config.js');
  const { listShops } = await import('../server/integrations/printify.js');
  const saved = config.printify.token;
  config.printify.token = '';
  try {
    await assert.rejects(() => listShops(), /PRINTIFY_API_TOKEN tanımlı değil/);
  } finally {
    config.printify.token = saved;
  }
});

test('mağaza listesi çekilir ve yetkilendirme başlığı gönderilir', async () => {
  const { listShops } = await import('../server/integrations/printify.js');
  let seenAuth = null;
  respond = (req, res) => {
    seenAuth = req.headers.authorization;
    json(res, 200, [{ id: 42, title: 'Test Mağaza', sales_channel: 'custom_integration' }]);
  };

  const shops = await listShops();
  assert.equal(shops[0].title, 'Test Mağaza');
  assert.equal(seenAuth, 'Bearer test-token');
});

test('connectionStatus geçersiz tokenda çökmez, sebebi döndürür', async () => {
  const { connectionStatus } = await import('../server/integrations/printify.js');
  respond = (req, res) => json(res, 401, { error: 'Unauthorized' });

  const status = await connectionStatus();
  assert.equal(status.connected, false);
  assert.match(status.reason, /401/);
});

test('katalog uçları doğru adresi çağırır', async () => {
  const { listVariants } = await import('../server/integrations/printify.js');
  let seenPath = null;
  respond = (req, res) => {
    seenPath = req.url;
    json(res, 200, { variants: [{ id: 1, price: 1000 }] });
  };

  const result = await listVariants(6, 99);
  assert.equal(seenPath, '/catalog/blueprints/6/print_providers/99/variants.json');
  assert.equal(result.variants[0].price, 1000);
});

test('ürün oluşturma isteği POST olarak ve gövdeyle gider', async () => {
  const { createProduct } = await import('../server/integrations/printify.js');
  let seen = {};
  respond = (req, res, body) => {
    seen = { method: req.method, url: req.url, body: JSON.parse(body) };
    json(res, 200, { id: 'prod_1' });
  };

  const created = await createProduct({ title: 'Deneme' });
  assert.equal(seen.method, 'POST');
  assert.equal(seen.url, '/shops/42/products.json');
  assert.equal(seen.body.title, 'Deneme');
  assert.equal(created.id, 'prod_1');
});
