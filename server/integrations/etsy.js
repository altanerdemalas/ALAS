import { config } from '../config.js';

/**
 * Etsy Open API v3 — rekabeti tahmin etmek yerine ölçmek için.
 * https://developers.etsy.com/documentation/
 *
 * Anahtar kelime araması gerçek sayılar verir: kaç aktif listing var,
 * fiyatlar nerede toplanıyor, ilgi (favori) ne düzeyde.
 */
export const hasEtsy = () => Boolean(config.etsy.apiKey);

async function request(path, params = {}) {
  if (!hasEtsy()) {
    throw new Error('Etsy API anahtarı tanımlı değil. Ayarlar sekmesinden ekleyebilirsin.');
  }

  const url = new URL(`${config.etsy.baseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { 'x-api-key': config.etsy.apiKey, 'User-Agent': 'alas-pod-agent' },
  });

  const text = await response.text();
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Etsy anahtarı kabul edilmedi (${response.status}). Anahtarın onaylandığından emin ol.`);
    }
    if (response.status === 429) {
      throw new Error('Etsy istek sınırına takıldı. Biraz bekleyip tekrar dene.');
    }
    throw new Error(`Etsy ${response.status}: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}

/** Anahtar kelimeye göre aktif listing araması. */
export const searchListings = (keywords, { limit = 100, sortOn = 'score' } = {}) =>
  request('/application/listings/active', { keywords, limit, sort_on: sortOn });

/**
 * Bir anahtar kelime için ölçülmüş rekabet tablosu.
 * Dönen her sayı gerçek veridir; hiçbiri model tahmini değildir.
 */
export async function keywordStats(keyword) {
  const data = await searchListings(keyword, { limit: 100 });
  const listings = data.results ?? [];

  const prices = listings
    .map((l) => toDollars(l.price))
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const favorites = listings
    .map((l) => Number(l.num_favorers) || 0)
    .sort((a, b) => a - b);

  return {
    keyword,
    totalListings: Number(data.count) || 0,
    sampleSize: listings.length,
    price: prices.length
      ? { median: median(prices), min: prices[0], max: prices[prices.length - 1], p25: percentile(prices, 25), p75: percentile(prices, 75) }
      : null,
    favorites: favorites.length
      ? { median: median(favorites), max: favorites[favorites.length - 1], zeroShare: share(favorites, (f) => f === 0) }
      : null,
    measuredAt: new Date().toISOString(),
  };
}

/**
 * Ölçülen rekabeti 0-10 skoruna çevirir (10 = en yoğun rekabet).
 * Eşikler POD için tipik aralıklara göre seçildi ve panelde açıkça gösterilir,
 * böylece skorun nereden geldiği gizli kalmaz.
 */
export function competitionScore({ totalListings }) {
  const esikler = [100, 500, 2000, 5000, 10000, 25000, 50000, 100000, 250000];
  return esikler.filter((esik) => totalListings >= esik).length + 1;
}

/**
 * Favori dağılımı talep için zayıf ama gerçek bir sinyal: listing'lerin çoğu
 * sıfır favoriyse ilgi düşüktür. Tek başına talep ölçüsü değildir — panelde
 * "sinyal" olarak, tahmin edilen talebin yanında gösterilir.
 */
export function interestSignal({ favorites, sampleSize }) {
  if (!favorites || !sampleSize) return null;
  return {
    medianFavorites: favorites.median,
    zeroSharePct: Math.round(favorites.zeroShare * 100),
    yorum:
      favorites.median >= 50 ? 'güçlü ilgi'
        : favorites.median >= 10 ? 'orta ilgi'
          : 'zayıf ilgi',
  };
}

/** Etsy fiyatları { amount, divisor } olarak gelir: 2499/100 = $24.99 */
const toDollars = (price) => {
  if (!price?.amount || !price?.divisor) return 0;
  return Number((price.amount / price.divisor).toFixed(2));
};

const median = (sorted) => {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
};

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

const share = (list, predicate) => list.filter(predicate).length / list.length;

/** Ayarlar sekmesindeki bağlantı testi. */
export async function connectionStatus() {
  if (!hasEtsy()) return { connected: false, reason: 'Anahtar yok' };
  try {
    const stats = await keywordStats('funny cat shirt');
    return { connected: true, sample: { keyword: stats.keyword, totalListings: stats.totalListings } };
  } catch (error) {
    return { connected: false, reason: error.message };
  }
}
