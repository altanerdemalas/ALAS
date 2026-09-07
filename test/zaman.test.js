/** Zaman damgası dönüşümü: UTC kayıt → yerel gösterim. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yerelZaman } from '../src/hooks.js';

test('ISO UTC damgası yerel saate çevrilir', () => {
  // İstanbul (UTC+3) için 17:02Z → 20:02 olmalı. Tarih ayırıcısı ortama göre
  // değişebildiği için ('.' ya da '/') sayılara bakıyoruz.
  process.env.TZ = 'Europe/Istanbul';
  const out = yerelZaman('2026-09-07T17:02:00Z');
  assert.match(out, /20:02/, `yerel saat 20:02 olmalı, gelen: ${out}`);
  assert.match(out, /07.09/, `gün ve ay görünmeli, gelen: ${out}`);
});

test('saat dilimi işareti olmayan eski kayıtlar da UTC sayılır', () => {
  process.env.TZ = 'Europe/Istanbul';
  assert.match(yerelZaman('2026-09-07 17:02:00'), /20:02/);
});

test('yıl istendiğinde eklenir', () => {
  process.env.TZ = 'Europe/Istanbul';
  assert.match(yerelZaman('2026-09-07T17:02:00Z', { tarihli: true }), /2026/);
});

test('boş veya bozuk değerde çökmez', () => {
  assert.equal(yerelZaman(null), '');
  assert.equal(yerelZaman(''), '');
  assert.equal(yerelZaman('bozuk-veri'), 'bozuk-veri');
});
