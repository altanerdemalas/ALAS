import { get, run, logEvent, parseJson } from '../db.js';
import { hasEtsy, keywordStats, competitionScore, interestSignal } from '../integrations/etsy.js';
import { nicheScore } from './research.js';

/**
 * Bir nişin rekabetini ölçer ve skoru ölçülmüş veriyle yeniden hesaplar.
 *
 * Model tahminini silmez, üstüne yazar ve kaynağını kaydeder: panelde hangi
 * sayının ölçüm hangisinin tahmin olduğu ayırt edilebilsin diye.
 */
export async function measureNiche(nicheId, { keyword } = {}) {
  const niche = get('SELECT * FROM niches WHERE id = ?', nicheId);
  if (!niche) throw new Error(`Niş bulunamadı: ${nicheId}`);
  if (!hasEtsy()) throw new Error('Etsy API anahtarı gerekli. Ayarlar sekmesinden ekleyebilirsin.');

  // Niş adı doğrudan arama terimi olarak kullanılır; kullanıcı isterse değiştirir.
  const term = (keyword || niche.name).trim();
  const stats = await keywordStats(term);

  const olculenRekabet = competitionScore(stats);
  const ilgi = interestSignal(stats);

  const measured = {
    competition: {
      value: olculenRekabet,
      source: 'etsy',
      keyword: term,
      detail: `${stats.totalListings.toLocaleString('tr-TR')} aktif listing`,
      raw: { totalListings: stats.totalListings, sampleSize: stats.sampleSize },
    },
    ...(stats.price && {
      price: {
        source: 'etsy',
        detail: `medyan $${stats.price.median} (orta yarı: $${stats.price.p25}–$${stats.price.p75})`,
        raw: stats.price,
      },
    }),
    ...(ilgi && {
      interest: {
        source: 'etsy',
        detail: `medyan ${ilgi.medianFavorites} favori — ${ilgi.yorum}`,
        raw: ilgi,
      },
    }),
  };

  // Skor, ölçülen rekabetle yeniden hesaplanır; talep ve marj tahmin kalır.
  const yeniSkor = nicheScore({
    demand: niche.demand,
    competition: olculenRekabet,
    margin: niche.margin,
  });

  run(
    `UPDATE niches SET competition = ?, score = ?, measured = ?, measured_at = ? WHERE id = ?`,
    olculenRekabet,
    yeniSkor,
    JSON.stringify(measured),
    stats.measuredAt,
    niche.id,
  );

  logEvent('measure', `Rekabet ölçüldü: ${niche.name} — ${measured.competition.detail}`, { nicheId, term });
  return { ...get('SELECT * FROM niches WHERE id = ?', niche.id), measured };
}

/** Panel için: ölçüm JSON'unu güvenle çözer. */
export const readMeasured = (niche) => (niche.measured ? parseJson(niche.measured, null) : null);
