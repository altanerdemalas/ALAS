/** Yayın öncesi kontroller ve Printify ürün yükü. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTrademark, checkListingQuality, checkDemand, checkPrice, summarizeChecks } from '../server/lib/preflight.js';
import { buildProductPayload } from '../server/integrations/printify.js';

test('marka ismi yakalanır ve sorun olarak işaretlenir', () => {
  const r = checkTrademark({
    listingTitle: 'Funny Disney Cat Shirt',
    listingDescription: 'A tee for fans',
    tags: ['cat shirt'],
  });
  assert.equal(r.durum, 'sorun');
  assert.match(r.detay, /disney/i);
});

test('etiketlerdeki marka da yakalanır', () => {
  const r = checkTrademark({ listingTitle: 'Cat Shirt', listingDescription: '', tags: ['pokemon', 'cat'] });
  assert.equal(r.durum, 'sorun');
});

test('lisans iddiası uyarı verir', () => {
  const r = checkTrademark({ listingTitle: 'Officially Licensed Cat Tee', listingDescription: '', tags: [] });
  assert.equal(r.durum, 'uyari');
});

test('temiz metin geçer ama "güvenli" iddiasında bulunmaz', () => {
  const r = checkTrademark({
    listingTitle: 'Funny Cat Mom Shirt, Gift for Cat Lovers',
    listingDescription: 'Soft unisex tee for people who love their cats.',
    tags: ['cat mom', 'funny shirt'],
  });
  assert.equal(r.durum, 'gecti');
  assert.match(r.detay, /tescil sorgusu değildir/);
});

test('eksik listing bileşenleri raporlanır', () => {
  const zayif = checkListingQuality({ listingTitle: 'Cat', listingDescription: 'kısa', tags: ['a'] });
  assert.equal(zayif.durum, 'sorun');
  assert.match(zayif.detay, /1\/13 etiket/);

  const iyi = checkListingQuality({
    listingTitle: 'Funny Cat Mom Shirt, Gift for Cat Lovers, Unisex Tee',
    listingDescription: 'x'.repeat(120),
    tags: Array.from({ length: 13 }, (_, i) => `tag ${i}`),
  });
  assert.equal(iyi.durum, 'gecti');
});

test('sıfır sonuçlu anahtar kelime sorun sayılır', () => {
  const r = checkDemand({ keyword: 'çok tuhaf bir terim', totalListings: 0 });
  assert.equal(r.durum, 'sorun');
  assert.match(r.oneri, /gerçekten yazdığı/);
});

test('Etsy anahtarı yoksa kontrol "atlandı" olur, geçmiş sayılmaz', () => {
  assert.equal(checkDemand(null).durum, 'atlandi');
  assert.equal(checkPrice(null, 25).durum, 'atlandi');
});

test('fiyat piyasa aralığına göre konumlanır', () => {
  const stats = { keyword: 'x', price: { p25: 20, median: 25, p75: 30 } };
  assert.equal(checkPrice(stats, 24).durum, 'gecti');
  assert.equal(checkPrice(stats, 8).durum, 'uyari', 'çok ucuz uyarmalı');
  assert.equal(checkPrice(stats, 60).durum, 'uyari', 'çok pahalı uyarmalı');
});

test('özet en kötü duruma göre karar verir', () => {
  const hepsiIyi = summarizeChecks([{ durum: 'gecti' }, { durum: 'atlandi' }]);
  assert.equal(hepsiIyi.sonuc, 'gecti');

  const uyarili = summarizeChecks([{ durum: 'gecti' }, { durum: 'uyari' }]);
  assert.equal(uyarili.sonuc, 'uyari');

  const sorunlu = summarizeChecks([{ durum: 'uyari' }, { durum: 'sorun' }]);
  assert.equal(sorunlu.sonuc, 'sorun');
  assert.equal(sorunlu.sorun, 1);
});

test('Printify ürün yükü doğru biçimde kurulur', () => {
  const payload = buildProductPayload({
    title: 'Funny Cat Shirt',
    description: 'Açıklama',
    blueprintId: '384',
    printProviderId: '1',
    variants: [{ id: 45740, price: 24.99 }, { id: 45741, price: 26.99 }],
    imageId: 'img_123',
  });

  assert.equal(payload.blueprint_id, 384, 'sayıya çevrilmeli');
  assert.equal(payload.print_provider_id, 1);
  assert.equal(payload.variants[0].price, 2499, 'fiyat sent cinsinden gitmeli');
  assert.equal(payload.variants[1].price, 2699);
  assert.ok(payload.variants.every((v) => v.is_enabled));
  assert.deepEqual(payload.print_areas[0].variant_ids, [45740, 45741]);
  assert.equal(payload.print_areas[0].placeholders[0].position, 'front');
  assert.equal(payload.print_areas[0].placeholders[0].images[0].id, 'img_123');
});
