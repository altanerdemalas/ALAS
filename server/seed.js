import { get, run, logEvent } from './db.js';

/**
 * Araştırma gündemi = müfredat. Öncelik sırası, sıfırdan başlayan birinin
 * ihtiyaç duyacağı bilgiyi doğru sırayla getirir: önce kanal ve ürün kararı,
 * sonra niş, sonra tasarım/SEO, en sonra ölçekleme.
 */
const TOPICS = [
  { p: 1, track: 'pazar', title: 'Printify ile başlangıç: kanal seçimi', question: 'Printify ile stoksuz e-ticarete sıfırdan başlarken Etsy, Shopify ve Printify Pop-Up Store arasında hangisi ilk kanal olmalı? Her birinin 2026 itibarıyla kurulum maliyeti, komisyonları ve trafik dinamikleri nedir?' },
  { p: 1, track: 'operasyon', title: 'Printify kurulum ve üretici seçimi', question: 'Printify hesabı açtıktan sonra blueprint ve print provider nasıl seçilir? Kalite, üretim süresi ve kargo maliyeti açısından hangi kriterlere bakılmalı?' },
  { p: 1, track: 'urun', title: 'Başlangıç için en kârlı ürün tipleri', question: 'Yeni başlayan bir POD satıcısı için en iyi kâr/risk dengesine sahip ürün tipleri hangileri? Tişört, kupa, poster, tote çanta ve hoodie için baz maliyet, kargo ve iade oranlarını karşılaştır.' },
  { p: 2, track: 'pazar', title: 'Niş bulma yöntemleri', question: 'POD için kârlı ve rekabeti yönetilebilir niş nasıl bulunur? Talep, rekabet ve mevsimsellik hangi ücretsiz araçlarla ölçülür? Somut örnek nişler ver.' },
  { p: 2, track: 'seo', title: 'Etsy listing SEO', question: 'Etsy aramasında üst sıraya çıkmak için başlık, tag, açıklama ve görsel nasıl optimize edilir? 2026 itibarıyla algoritma hangi sinyallere bakıyor?' },
  { p: 2, track: 'urun', title: 'Fiyatlandırma ve kâr marjı', question: 'Printify baz maliyeti, kargo, kanal komisyonu ve reklam düşüldükten sonra sağlıklı bir kâr marjı için fiyat nasıl belirlenir? Örnek hesaplama ver.' },
  { p: 2, track: 'tasarim', title: 'Tasarım üretimi ve baskı dosyası standartları', question: 'POD için baskıya hazır tasarım dosyası nasıl hazırlanır? DPI, boyut, renk profili, şeffaf zemin ve baskı alanı kuralları neler? Yapay zeka ile görsel üretirken nelere dikkat edilmeli?' },
  { p: 2, track: 'operasyon', title: 'Telif hakkı ve marka riskleri', question: 'POD\'da hangi tasarımlar telif/marka ihlali sayılır? Etsy ve Printify hangi durumlarda listing kaldırıyor veya hesap kapatıyor? Riskten kaçınma kuralları neler?' },
  { p: 3, track: 'tasarim', title: 'Mockup ve ürün görselleri', question: 'Dönüşümü artıran ürün görselleri nasıl hazırlanır? Kaç görsel, hangi sırayla, hangi tipte (mockup, lifestyle, ölçü tablosu) olmalı?' },
  { p: 3, track: 'pazar', title: 'İlk 100 satışa giden yol', question: 'Yeni bir POD mağazası ilk satışlarını nasıl alır? Organik trafik, Etsy Ads, Pinterest ve TikTok kanallarının maliyet/etki karşılaştırması nedir?' },
  { p: 3, track: 'operasyon', title: 'Müşteri hizmetleri ve iade politikası', question: 'POD\'da iade, hasarlı ürün ve geç kargo durumları nasıl yönetilir? Printify\'ın yeniden baskı politikası nedir, maliyeti kim üstlenir?' },
  { p: 3, track: 'seo', title: 'Shopify mağazası ve SEO', question: 'Shopify\'da POD mağazası açarken hangi tema, uygulama ve SEO ayarları gerekir? Printify entegrasyonu nasıl kurulur?' },
  { p: 4, track: 'pazar', title: 'Mevsimsel ve tatil dönemi planlaması', question: 'POD\'da yılbaşı, sevgililer günü, anneler günü gibi dönemler için ne kadar önceden hazırlık yapılmalı? Üretim ve kargo kesim tarihleri nasıl planlanır?' },
  { p: 4, track: 'urun', title: 'Ölçekleme: ne zaman ürün yelpazesi genişletilir', question: 'Hangi metrikler bir nişin çalıştığını gösterir ve ne zaman yeni ürün/niş eklenmelidir? Başarısız listing\'ler ne zaman kapatılmalı?' },
];

export function seedTopics() {
  let added = 0;
  for (const t of TOPICS) {
    if (get('SELECT id FROM topics WHERE title = ?', t.title)) continue;
    run(
      'INSERT INTO topics (title, question, track, priority) VALUES (?, ?, ?, ?)',
      t.title, t.question, t.track, t.p,
    );
    added++;
  }
  if (added) logEvent('seed', `${added} araştırma konusu gündeme eklendi`);
  return added;
}
