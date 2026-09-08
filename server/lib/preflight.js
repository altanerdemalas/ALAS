/**
 * Yayın öncesi kontrol: pahalı hataları yayına çıkmadan yakalar.
 *
 * Her kontrol bir sonuç döndürür: 'gecti' | 'uyari' | 'sorun'.
 * Etsy verisi gerektirenler anahtar yoksa 'atlandi' olur — sessizce
 * "sorun yok" demez, kontrol edilmediğini söyler.
 */

/**
 * Bilinen marka/karakter/franchise kalıpları. Bu bir tescil sorgusu DEĞİLDİR;
 * POD satıcılarının en sık listing kaldırttığı isimlerden derlenmiş bir
 * uyarı listesidir. Temiz çıkması "güvenli" anlamına gelmez.
 */
const RISKLI_TERIMLER = [
  'disney', 'pixar', 'marvel', 'dc comics', 'star wars', 'harry potter', 'pokemon', 'pokémon',
  'nintendo', 'mario', 'zelda', 'minecraft', 'fortnite', 'roblox', 'hello kitty', 'sanrio',
  'nike', 'adidas', 'puma', 'gucci', 'louis vuitton', 'chanel', 'supreme', 'north face',
  'coca cola', 'coca-cola', 'pepsi', 'starbucks', 'mcdonald', 'apple inc',
  'nfl', 'nba', 'fifa', 'uefa', 'olympics', 'super bowl',
  'netflix', 'spotify', 'tiktok', 'instagram', 'facebook', 'youtube',
  'barbie', 'lego', 'peppa pig', 'bluey', 'sesame street', 'winnie the pooh',
  'taylor swift', 'beyonce', 'beyoncé', 'kardashian',
];

/** ® ™ © işaretleri ve "official/licensed" gibi hak iddiası eden ifadeler. */
const HAK_IDDIASI = /[®™©]|\b(official|officially licensed|licensed|authentic brand)\b/i;

export function checkTrademark({ listingTitle = '', listingDescription = '', tags = [] }) {
  const metin = [listingTitle, listingDescription, ...tags].join(' ').toLowerCase();
  const bulunan = RISKLI_TERIMLER.filter((terim) => metin.includes(terim));
  const hakIddiasi = HAK_IDDIASI.test(`${listingTitle} ${listingDescription} ${tags.join(' ')}`);

  if (bulunan.length) {
    return {
      id: 'telif',
      durum: 'sorun',
      baslik: 'Telif / marka riski',
      detay: `Metinde riskli terim geçiyor: ${bulunan.join(', ')}. Bu tür listing'ler kaldırılır, tekrarı hesabı kapatır.`,
      oneri: 'Bu terimleri çıkar ve jenerik bir ifadeyle değiştir.',
    };
  }
  if (hakIddiasi) {
    return {
      id: 'telif',
      durum: 'uyari',
      baslik: 'Hak iddiası ifadesi',
      detay: 'Metinde "official/licensed" gibi bir ifade veya ®/™ işareti var. Lisansın yoksa bu iddiada bulunma.',
      oneri: 'İfadeyi kaldır.',
    };
  }
  return {
    id: 'telif',
    durum: 'gecti',
    baslik: 'Telif / marka',
    detay: 'Bilinen riskli terim bulunamadı. Bu bir tescil sorgusu değildir — özgün bir ifade kullandığından emin ol.',
  };
}

/** Etsy listing metninin biçimsel eksikleri. */
export function checkListingQuality({ listingTitle = '', listingDescription = '', tags = [] }) {
  const sorunlar = [];
  if (listingTitle.length < 20) sorunlar.push('başlık çok kısa (arama kelimeleri sığmaz)');
  if (listingTitle.length > 140) sorunlar.push('başlık 140 karakteri aşıyor (Etsy keser)');
  if (tags.length < 13) sorunlar.push(`${tags.length}/13 etiket dolu — hepsini kullan`);
  if (listingDescription.length < 80) sorunlar.push('açıklama çok kısa');

  return {
    id: 'listing',
    durum: sorunlar.length === 0 ? 'gecti' : sorunlar.length > 2 ? 'sorun' : 'uyari',
    baslik: 'Listing kalitesi',
    detay: sorunlar.length ? sorunlar.join(' · ') : `Başlık ${listingTitle.length} karakter, ${tags.length} etiket dolu.`,
    oneri: sorunlar.length ? 'Eksikleri tamamla; her etiket ayrı bir aramayı yakalar.' : undefined,
  };
}

/** Anahtar kelime gerçekten aranıyor mu? Etsy'deki sonuç sayısı gösterir. */
export function checkDemand(stats) {
  if (!stats) {
    return { id: 'talep', durum: 'atlandi', baslik: 'Arama hacmi', detay: 'Etsy anahtarı yok — kontrol edilemedi.' };
  }
  const n = stats.totalListings;
  if (n === 0) {
    return {
      id: 'talep', durum: 'sorun', baslik: 'Arama hacmi',
      detay: `"${stats.keyword}" için hiç aktif listing yok. Rakip yokluğu genelde talep yokluğudur.`,
      oneri: 'Alıcıların gerçekten yazdığı bir ifade seç.',
    };
  }
  if (n < 100) {
    return {
      id: 'talep', durum: 'uyari', baslik: 'Arama hacmi',
      detay: `"${stats.keyword}" için sadece ${n} listing var. Niş çok dar olabilir.`,
      oneri: 'Biraz daha geniş bir ifadeyi de dene.',
    };
  }
  return {
    id: 'talep', durum: 'gecti', baslik: 'Arama hacmi',
    detay: `"${stats.keyword}" için ${n.toLocaleString('tr-TR')} aktif listing — talep var.`,
  };
}

/** Fiyat piyasanın neresinde? Aşırı sapma dönüşümü öldürür. */
export function checkPrice(stats, price) {
  if (!stats?.price) {
    return { id: 'fiyat', durum: 'atlandi', baslik: 'Fiyat konumu', detay: 'Etsy fiyat verisi yok — kontrol edilemedi.' };
  }
  if (!(price > 0)) {
    return { id: 'fiyat', durum: 'atlandi', baslik: 'Fiyat konumu', detay: 'Fiyat girilmedi.' };
  }

  const { p25, p75, median } = stats.price;
  const konum = `Senin fiyatın $${price.toFixed(2)}, piyasa medyanı $${median} (orta yarı $${p25}–$${p75}).`;

  if (price < p25 * 0.7) {
    return {
      id: 'fiyat', durum: 'uyari', baslik: 'Fiyat konumu',
      detay: `${konum} Piyasanın belirgin altındasın.`,
      oneri: 'Ucuzluk dönüşüm getirmeyebilir; marjını kontrol et.',
    };
  }
  if (price > p75 * 1.3) {
    return {
      id: 'fiyat', durum: 'uyari', baslik: 'Fiyat konumu',
      detay: `${konum} Piyasanın belirgin üstündesin.`,
      oneri: 'Bu fiyatı haklı çıkaracak bir fark sunmuyorsan dönüşüm düşer.',
    };
  }
  return { id: 'fiyat', durum: 'gecti', baslik: 'Fiyat konumu', detay: `${konum} Aralık içindesin.` };
}

/** Tüm kontrollerin özeti. */
export function summarizeChecks(checks) {
  const sorun = checks.filter((c) => c.durum === 'sorun').length;
  const uyari = checks.filter((c) => c.durum === 'uyari').length;
  return {
    checks,
    sorun,
    uyari,
    sonuc: sorun > 0 ? 'sorun' : uyari > 0 ? 'uyari' : 'gecti',
  };
}
