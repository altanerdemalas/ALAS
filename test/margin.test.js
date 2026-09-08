/** Kâr hesabı: her kalem doğrulanabilir olmalı, sürprizsiz. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMargin, breakEven, priceForMargin, CHANNEL_FEES, centsToDollars } from '../server/lib/margin.js';

test('Etsy kalemleri tek tek doğru hesaplanır', () => {
  const r = calculateMargin({ basePrice: 11.42, shippingCost: 4.75, salePrice: 24.99, channel: 'etsy', returnRate: 0 });

  assert.equal(r.buyerPays, 24.99);
  const kalem = (parca) => r.items.find((i) => i.label.includes(parca)).amount;
  assert.equal(kalem('baz maliyeti'), 11.42);
  assert.equal(kalem('kargo'), 4.75);
  assert.equal(kalem('listeleme'), 0.2);
  assert.equal(kalem('işlem'), Number((24.99 * 0.065).toFixed(2)));       // 1.62
  assert.equal(kalem('Ödeme'), Number((24.99 * 0.03 + 0.25).toFixed(2))); // 1.00

  assert.equal(r.totalCost, Number((11.42 + 4.75 + 0.2 + 1.62 + 1.0).toFixed(2)));
  assert.equal(r.profit, Number((24.99 - r.totalCost).toFixed(2)));
  assert.ok(r.marginPct > 0 && r.marginPct < 100);
});

test('müşteriden alınan kargo komisyona dahil edilir', () => {
  const ucretsiz = calculateMargin({ basePrice: 10, shippingCost: 5, salePrice: 25, shippingCharged: 0 });
  const ayri = calculateMargin({ basePrice: 10, shippingCost: 5, salePrice: 20, shippingCharged: 5 });

  assert.equal(ucretsiz.buyerPays, 25);
  assert.equal(ayri.buyerPays, 25, 'toplam tahsilat aynı olmalı');
  // Etsy komisyonu kargo dahil işlediği için iki senaryonun kârı da aynı çıkar.
  assert.equal(ucretsiz.profit, ayri.profit);
});

test('başabaş fiyatta kâr sıfırdır', () => {
  const girdi = { basePrice: 12, shippingCost: 4, channel: 'etsy', returnRate: 0.02 };
  const fiyat = breakEven(girdi);
  const sonuc = calculateMargin({ ...girdi, salePrice: fiyat });
  assert.ok(Math.abs(sonuc.profit) < 0.02, `başabaşta kâr ~0 olmalı, çıkan: ${sonuc.profit}`);
});

test('hedef marj için önerilen fiyat o marjı tutturur', () => {
  const girdi = { basePrice: 11.42, shippingCost: 4.75, channel: 'etsy', adRate: 0.1 };
  const fiyat = priceForMargin({ ...girdi, targetMarginPct: 30 });
  const sonuc = calculateMargin({ ...girdi, salePrice: fiyat });
  assert.ok(Math.abs(sonuc.marginPct - 30) < 0.5, `%30 bekleniyordu, çıkan: %${sonuc.marginPct}`);
});

test('reklam oranı kârı düşürür', () => {
  const reklamsiz = calculateMargin({ basePrice: 10, shippingCost: 4, salePrice: 25, adRate: 0 });
  const reklamli = calculateMargin({ basePrice: 10, shippingCost: 4, salePrice: 25, adRate: 0.15 });
  assert.ok(reklamli.profit < reklamsiz.profit);
  assert.equal(Number((reklamsiz.profit - reklamli.profit).toFixed(2)), Number((25 * 0.15).toFixed(2)));
});

test('zarardaki fiyat negatif kâr gösterir, gizlemez', () => {
  const r = calculateMargin({ basePrice: 20, shippingCost: 6, salePrice: 15 });
  assert.ok(r.profit < 0);
  assert.ok(r.marginPct < 0);
});

test('Shopify pazaryeri komisyonu almaz', () => {
  const etsy = calculateMargin({ basePrice: 10, shippingCost: 4, salePrice: 25, channel: 'etsy' });
  const shopify = calculateMargin({ basePrice: 10, shippingCost: 4, salePrice: 25, channel: 'shopify' });
  assert.ok(shopify.profit > etsy.profit, 'Shopify daha az kesinti yapmalı');
  assert.equal(CHANNEL_FEES.shopify.transactionPct, 0);
});

test('komisyon oranları kaynak ve doğrulama tarihiyle saklanır', () => {
  for (const [key, fee] of Object.entries(CHANNEL_FEES)) {
    assert.ok(fee.source?.startsWith('http'), `${key} için kaynak olmalı`);
    assert.match(fee.verifiedAt, /^\d{4}-\d{2}$/, `${key} için doğrulama tarihi olmalı`);
  }
});

test('Printify sent değerleri dolara çevrilir', () => {
  assert.equal(centsToDollars(2499), 24.99);
  assert.equal(centsToDollars(0), 0);
  assert.equal(centsToDollars(undefined), 0);
});
