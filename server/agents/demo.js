/**
 * Demo modu: ANTHROPIC_API_KEY yokken de panelin gerçek içerikle çalışması için
 * elle yazılmış temel POD bilgisi. Model bağlanınca bu içerik yerini canlı,
 * kaynaklı araştırmaya bırakır — akış ve veri şeması birebir aynıdır.
 */

const byTrack = {
  pazar: {
    findings: [
      {
        title: 'Kanal seçimi trafik kaynağını belirler',
        summary: 'Etsy hazır alıcı trafiği getirir, Shopify trafiği sana bırakır; ikisinin işi farklıdır.',
        detail:
          'Etsy pazaryeridir: arama yapan alıcı zaten oradadır, işin listing SEO ve görsel. Shopify kendi mağazandır: trafiği reklam, içerik veya sosyal medyadan sen getirirsin. Printify Pop-Up Store ücretsiz ve kurulumu dakikalar sürer, ama pazarlama tamamen sana kalır. Sıfırdan başlayan biri için mantıklı sıra: Pop-Up ile ürün/üretim akışını test et, satış sinyali alınca Etsy\'de ciddi listing çalışması yap, marka oturunca Shopify aç.',
        category: 'kanal',
        confidence: 'yuksek',
      },
      {
        title: 'İlk ürünü satmadan önce numune sipariş et',
        summary: 'Baskı kalitesi ve kumaş hissi ancak elde görülür; iade ve kötü yorum bundan çıkar.',
        detail:
          'Printify üretimi farklı print provider\'lara dağıtır ve aynı ürün sağlayıcıdan sağlayıcıya farklı çıkar. Satışa açmadan önce en az bir numune sipariş et: baskı netliği, renk sapması, kumaş ağırlığı ve yıkama sonrası durumu kontrol et. Bu adımı atlayan yeni satıcıların ilk olumsuz yorumları neredeyse her zaman kalite kaynaklıdır.',
        category: 'operasyon',
        confidence: 'yuksek',
      },
    ],
    lesson: {
      title: 'Hangi kanaldan başlamalısın?',
      level: 1,
      summary: 'Etsy, Shopify ve Printify Pop-Up arasındaki farkı ve sıralamayı öğren.',
      body_md: `## Üç kanal, üç farklı iş

**Printify Pop-Up Store** — Ücretsiz, hazır mağaza. Ödeme ve kargo Printify tarafında. Avantajı: sıfır maliyetle üretim akışını uçtan uca test edersin. Dezavantajı: hiç organik trafik yok, her ziyaretçiyi sen getirmelisin.

**Etsy** — El yapımı/tasarım ürün arayan hazır alıcı kitlesi. Avantajı: arama trafiği bedava gelir. Dezavantajı: listing başına ücret, işlem komisyonu ve yoğun rekabet. Burada kazanan şey **listing SEO'su ve ilk görsel**.

**Shopify** — Kendi markan, tam kontrol, aylık abonelik. Trafik tamamen senin sorumluluğun. Marka ve tekrar eden müşteri oluşunca en kârlı kanal.

## Sana önerilen sıra

1. Pop-Up ile 2-3 ürün yayınla, kendine bir numune sipariş et.
2. Numune kaliteliyse aynı tasarımları Etsy'ye taşı ve SEO'ya çalış.
3. Etsy'de düzenli satış geldiğinde Shopify'ı marka mağazası olarak aç.

## Neden bu sıra?

Her adım bir öncekinin riskini düşürür. Pop-Up üretim riskini, Etsy talep riskini, Shopify ise ancak talep kanıtlandıktan sonra anlamlı olan marka yatırımını test eder.`,
      action_items: [
        'Printify hesabı aç ve Pop-Up Store\'u etkinleştir.',
        'Bir blueprint seç (ör. Unisex Heavy Cotton Tee) ve print provider\'ların puanlarını karşılaştır.',
        'Kendine bir numune sipariş et ve kaliteyi not al.',
      ],
    },
    niches: [
      { name: 'Kedi sahipleri için mizahi tişörtler', audience: 'ABD, 25-45 yaş, evcil hayvan sahipleri', rationale: 'Sürekli talep, güçlü duygusal bağ, hediye potansiyeli yüksek.', demand: 8, competition: 8, margin: 6, seasonality: 'Yıl boyu, yılbaşında zirve' },
      { name: 'Hemşireler için mesleki mizah', audience: 'ABD sağlık çalışanları', rationale: 'Net tanımlı kitle, meslek grubuna özel dil, kurum içi hediyeleşme.', demand: 7, competition: 5, margin: 7, seasonality: 'Hemşireler Haftası (Mayıs) zirve' },
    ],
    next_questions: [
      'Etsy 2026 itibarıyla listing ücreti, işlem komisyonu ve reklam maliyetleri tam olarak nedir?',
      'Printify print provider seçerken hangi metrikler kaliteyi öngörür?',
    ],
  },

  seo: {
    findings: [
      {
        title: 'Etsy başlığında ilk 40 karakter en değerli alandır',
        summary: 'Arama sonucunda ve mobilde önce o kısım görünür; anahtar kelime oraya girer.',
        detail:
          'Başlığı "ana anahtar kelime + ürün tipi + kime/ne için" kalıbıyla kur. Anahtar kelimeleri virgülle boğmak yerine alıcının aradığı doğal ifadeyi kullan. 13 tag alanının hepsini doldur ve tag\'leri başlıkla birebir tekrar etmek yerine eş anlamlı/uzun kuyruk varyasyonlarıyla genişlet.',
        category: 'seo',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Etsy listing SEO temelleri',
      level: 1,
      summary: 'Başlık, tag ve görsel üçlüsünün arama sıralamasındaki rolü.',
      body_md: `## Etsy araması nasıl çalışır

Etsy önce **eşleşme** (başlık + tag + kategori), sonra **kalite skoru** (tıklanma, favori, satış dönüşümü) bakar. Yani listing metni seni arama sonucuna sokar, **ilk görsel** seni tıklattırır, fiyat ve yorumlar satışı kapatır.

## Pratik kurallar

- **Başlık:** İlk 40 karakter en kritik. Kalıp: \`Ana kelime + ürün + hedef kitle/ocasyon\`.
- **Tag:** 13'ün hepsini kullan. Tek kelimelik genel tag'ler yerine 2-3 kelimelik uzun kuyruk ifadeler ("funny cat mom shirt") daha iyi dönüşür.
- **Görsel:** İlk kare mockup değil, *bağlam* olsun — ürün giyilirken veya kullanılırken.
- **Açıklama:** İlk iki cümle arama snippet'ine girer; ürünün kime ne fayda sağladığını orada söyle.

## Sık yapılan hata

Aynı anahtar kelimeyi başlıkta, tag'lerde ve açıklamada tekrar etmek sıralamayı yükseltmez; kapsama alanını daraltır. Her alanı farklı arama ifadelerini yakalamak için kullan.`,
      action_items: [
        'Rakip 10 listing\'in başlıklarını bir tabloya çıkar, ortak anahtar kelimeleri işaretle.',
        'Kendi listing\'in için 13 tag\'lik bir liste hazırla, en az 8\'i uzun kuyruk olsun.',
      ],
    },
    niches: [],
    next_questions: ['Etsy arama algoritmasında "listing quality score" hangi sinyallerden oluşur?'],
  },

  genel: {
    findings: [
      {
        title: 'POD\'da kâr marjı ürün seçimiyle başlar',
        summary: 'Baz maliyet + kargo + kanal komisyonu düşülmeden fiyat belirlemek en yaygın hatadır.',
        detail:
          'Basit formül: Satış fiyatı − (Printify baz maliyeti + kargo + kanal komisyonu + ödeme komisyonu + reklam) = kâr. Tişörtte sağlıklı marj için genelde baz maliyetin 2-2.5 katı fiyat gerekir. Kupa ve poster gibi düşük baz maliyetli ürünlerde yüzde marj yüksektir ama kargo maliyeti oranı daha ağır basar.',
        category: 'finans',
        confidence: 'yuksek',
      },
    ],
    lesson: {
      title: 'Fiyatlandırma ve kâr hesabı',
      level: 1,
      summary: 'Bir POD ürününde paranın nereye gittiğini kalem kalem gör.',
      body_md: `## Maliyet kalemleri

1. **Printify baz maliyeti** — ürün + baskı.
2. **Kargo** — sağlayıcıya ve ülkeye göre değişir; çoklu üründe düşer.
3. **Kanal komisyonu** — Etsy'de listing + işlem + ödeme kalemleri ayrı ayrı işler.
4. **Reklam** — kullanıyorsan satış başına maliyeti hesaba kat.
5. **İade/yeniden baskı payı** — cironun küçük ama sıfır olmayan bir yüzdesi.

## Basit kural

Tişörtte **baz maliyet × 2.2** iyi bir başlangıç fiyatıdır. Bunun altındaysan reklam veremezsin; çok üstündeysen dönüşüm düşer.

## Test etme yöntemi

Aynı tasarımı iki farklı fiyattan iki hafta yayınla, tıklanma değil **dönüşüm oranını** karşılaştır. Trafik azken fiyat testi yanıltır; önce günde 30-50 ziyaretçiye ulaş.`,
      action_items: [
        'Seçtiğin ürün için baz maliyet + kargo + komisyonu bir tabloya yaz.',
        '2.2x kuralıyla bir fiyat belirle ve marjı hesapla.',
      ],
    },
    niches: [],
    next_questions: ['Printify baz maliyetleri sağlayıcıya göre ne kadar değişiyor?'],
  },
};

export function demoResearch(topic) {
  const base = byTrack[topic.track] ?? byTrack.genel;
  return {
    ...structuredClone(base),
    sources: [{ title: 'Demo içerik (API anahtarı bağlanınca canlı araştırma yapılır)', url: 'https://printify.com/app/help' }],
  };
}

export function demoProductIdeas(niche) {
  return {
    ideas: [
      {
        title: `${niche.name} — minimal tipografi tişört`,
        blueprint: 'Unisex Heavy Cotton Tee (Gildan 5000)',
        design_brief: `Tek renk, kalın grotesk tipografi. Kitleye (${niche.audience || 'hedef kitle'}) içeriden bir göndermeyle kısa slogan. Göğüs ortası, 28x35 cm baskı alanı, koyu zemin üzerine krem renk.`,
        image_prompt: `Minimal bold typography t-shirt design, short witty slogan about ${niche.name}, single cream color on transparent background, centered, high contrast, no mockup, print-ready PNG 4500x5400`,
        listing_title: `Funny ${niche.name} Shirt, Gift for ${niche.audience || 'Fans'}, Unisex Tee`,
        listing_description: `Soft unisex tee for anyone who lives the ${niche.name} life. Printed on demand, so it ships fresh — not from a dusty warehouse.\n\n• Unisex fit, true to size\n• Heavy cotton, holds print after washing\n• Ships in 3-7 business days`,
        tags: ['funny shirt', 'gift idea', niche.name.toLowerCase(), 'unisex tee', 'graphic tee'],
        price_suggestion: '$24.99 (baz maliyet ~$11, marj ~%50)',
      },
    ],
  };
}
