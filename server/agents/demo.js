/**
 * Demo modu: ANTHROPIC_API_KEY yokken de panelin gerçek içerikle çalışması için
 * elle yazılmış temel POD bilgisi. İçerik seed.js'teki 14 konunun her biri için
 * ayrı yazıldı — aynı ders tekrar tekrar görünmesin diye.
 *
 * Bilinçli olarak kalıcı bilgiye odaklanır: süreç, karar çerçevesi, ölçüt.
 * Komisyon oranı, baz maliyet gibi sık değişen rakamları burada iddia etmez;
 * onlar API anahtarı bağlanınca canlı araştırmayla, kaynak göstererek gelir.
 */

const byTopic = {
  // ------------------------------------------------------------------ pazar

  'Printify ile başlangıç: kanal seçimi': {
    findings: [
      {
        title: 'Kanal seçimi trafik kaynağını belirler',
        summary: 'Etsy hazır alıcı trafiği getirir, Shopify trafiği sana bırakır; ikisinin işi farklıdır.',
        detail:
          'Etsy bir pazaryeridir: arama yapan alıcı zaten oradadır, senin işin listing SEO ve görsel. Shopify kendi mağazandır: trafiği reklam, içerik veya sosyal medyadan sen getirirsin. Printify Pop-Up Store ücretsizdir ve dakikalar içinde kurulur, ama pazarlama tamamen sana kalır.',
        category: 'kanal',
        confidence: 'yuksek',
      },
    ],
    lesson: {
      title: 'Hangi kanaldan başlamalısın?',
      level: 1,
      summary: 'Etsy, Shopify ve Printify Pop-Up arasındaki farkı ve doğru sıralamayı öğren.',
      body_md: `## Üç kanal, üç farklı iş

**Printify Pop-Up Store** — Ücretsiz, hazır mağaza. Ödeme ve kargo Printify tarafında. Avantajı: sıfır maliyetle üretim akışını uçtan uca test edersin. Dezavantajı: hiç organik trafik yok.

**Etsy** — Tasarım ürünü arayan hazır alıcı kitlesi. Avantajı: arama trafiği bedava gelir. Dezavantajı: listing ve işlem ücretleri, yoğun rekabet. Burada kazandıran şey **listing SEO'su ve ilk görsel**.

**Shopify** — Kendi markan, tam kontrol, aylık abonelik. Trafik tamamen senin sorumluluğun. Marka ve tekrar eden müşteri oluşunca en kârlı kanal.

## Sana önerilen sıra

1. Pop-Up ile 2-3 ürün yayınla, kendine bir numune sipariş et.
2. Numune kaliteliyse aynı tasarımları Etsy'ye taşı ve SEO'ya çalış.
3. Etsy'de düzenli satış geldiğinde Shopify'ı marka mağazası olarak aç.

## Neden bu sıra?

Her adım bir öncekinin riskini düşürür. Pop-Up üretim riskini, Etsy talep riskini, Shopify ise ancak talep kanıtlandıktan sonra anlamlı olan marka yatırımını test eder.`,
      action_items: [
        "Printify hesabı aç ve Pop-Up Store'u etkinleştir.",
        'Hangi kanalla başlayacağına karar ver ve bunu bir yere yaz.',
      ],
    },
    niches: [
      { name: 'Kedi sahipleri için mizahi tişörtler', audience: 'ABD, 25-45 yaş, evcil hayvan sahipleri', rationale: 'Sürekli talep, güçlü duygusal bağ, hediye potansiyeli yüksek.', demand: 8, competition: 8, margin: 6, seasonality: 'Yıl boyu, yılbaşında zirve' },
    ],
  },

  'Niş bulma yöntemleri': {
    findings: [
      {
        title: 'İyi niş "kim" sorusuna cevap verir, "ne" sorusuna değil',
        summary: '"Tişört satıyorum" niş değildir; "ilk yılını dolduran hemşirelere hediye tişört" niştir.',
        detail:
          'Niş bir ürün kategorisi değil, tanımlı bir insan grubudur. Grup ne kadar netse tasarımın dili o kadar keskin, rekabet o kadar seyrek, dönüşüm o kadar yüksek olur. "Kim, hangi anda, kime hediye ediyor?" sorusuna tek cümleyle cevap veremiyorsan niş yeterince daralmamıştır.',
        category: 'nis',
        confidence: 'yuksek',
      },
      {
        title: 'Rekabet sinyali listing sayısı değil, listing kalitesidir',
        summary: 'Binlerce sonuç çıkması kötü değil; hepsinin iyi olması kötü.',
        detail:
          'Bir aramada çok sonuç çıkması talebin var olduğunu gösterir — bu iyi haberdir. Asıl bakman gereken ilk sayfadaki listing\'lerin kalitesi: görseller amatörse, başlıklar anahtar kelime yığınıysa, yorum sayıları düşükse orada yer vardır. İlk sayfa profesyonel markalarla doluysa o nişe yeni girmek pahalıdır.',
        category: 'nis',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Kârlı niş nasıl bulunur?',
      level: 1,
      summary: 'Niş daraltmanın mantığı, talep ve rekabetin ücretsiz araçlarla ölçülmesi.',
      body_md: `## Niş = insan grubu

Ürünle değil, insanla başla. "Tişört" bir ürün; "köpeğini çocuğu gibi seven 30'lu yaşlardaki sahipler" bir niş. Grup daraldıkça tasarımın söyleyebileceği şey keskinleşir.

## Nereden fikir çıkar

- **Meslekler** — hemşire, öğretmen, mühendis, aşçı. Meslek içi şakalar dışarıdan anlaşılmaz, bu bir avantajdır.
- **Hobiler** — dalış, tırmanış, örgü, satranç, bitki bakımı.
- **Yaşam anları** — yeni ebeveyn, emeklilik, mezuniyet, taşınma.
- **Kimlik** — evcil hayvan sahipliği, memleket, dil, aidiyet.

## Üç filtreden geçir

1. **Talep** — Bu grup için arama yapan insan var mı? Etsy arama kutusuna yazınca otomatik tamamlama ne öneriyor?
2. **Rekabet** — İlk sayfadaki listing'ler iyi mi kötü mü? Kötüyse fırsat var.
3. **Marj** — Bu grup hediye alıyor mu? Hediye alıcıları fiyata daha az duyarlıdır.

## Sık yapılan hata

Kendi ilgi alanını niş sanmak. Sen seviyorsun diye talep olmayabilir. Kararı arama verisi versin, zevkin değil.`,
      action_items: [
        'Üç niş adayı yaz ve her biri için "kim, hangi anda satın alıyor?" sorusunu cevapla.',
        'Her aday için Etsy aramasında ilk sayfayı incele; görsel kalitesini 10 üzerinden puanla.',
      ],
    },
    niches: [
      { name: 'Hemşireler için mesleki mizah', audience: 'ABD sağlık çalışanları', rationale: 'Net tanımlı kitle, meslek grubuna özel dil, kurum içi hediyeleşme yaygın.', demand: 7, competition: 5, margin: 7, seasonality: 'Hemşireler Haftası (Mayıs) zirve' },
      { name: 'Yeni ebeveynler için uykusuzluk mizahı', audience: 'ABD, 28-40 yaş, ilk çocuğu olanlar', rationale: 'Yüksek duygusal an, bebek hediyesi alışkanlığı güçlü, tekrar alım potansiyeli var.', demand: 7, competition: 6, margin: 7, seasonality: 'Yıl boyu dengeli' },
      { name: 'Bitki bakımı meraklıları', audience: 'ABD/AB, 25-40 yaş, ev bitkisi koleksiyoncuları', rationale: 'Kendini "bitki ebeveyni" olarak tanımlayan, aidiyet dili güçlü topluluk.', demand: 6, competition: 6, margin: 6, seasonality: 'İlkbaharda yükselir' },
    ],
  },

  'İlk 100 satışa giden yol': {
    findings: [
      {
        title: 'İlk satışlar üründen değil, görünürlükten gelir',
        summary: 'Yeni listing hiç kimseye gösterilmez; ilk tıklamaları sen üretmelisin.',
        detail:
          'Pazaryeri algoritmaları bir listing\'i sıralamak için veriye ihtiyaç duyar: tıklanma, favori, satış. Hiç verisi olmayan yeni listing en dibe düşer. Bu kısır döngüyü kırmanın yolları: küçük bütçeli platform reklamı, ilgili topluluklarda organik paylaşım, ve Pinterest gibi arama tabanlı sosyal platformlar.',
        category: 'pazarlama',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'İlk 100 satış: soğuk başlangıç problemi',
      level: 2,
      summary: 'Sıfır veriyle açılan mağaza nasıl görünür hale gelir?',
      body_md: `## Problem

Yeni listing'in hiçbir verisi yoktur, bu yüzden algoritma onu göstermez. Gösterilmediği için veri toplayamaz. Bu döngüyü dışarıdan kırman gerekir.

## Üç yol, farklı maliyetler

**Platform reklamı** — En hızlısı. Günlük çok küçük bir bütçeyle başla. Amaç kâr etmek değil, listing'e ilk tıklama ve satış verisini kazandırmak. Hangi listing'in dönüştüğünü öğrenmen de cabası.

**Pinterest** — POD için orantısız etkili, çünkü Pinterest bir sosyal ağdan çok görsel arama motorudur ve paylaşımların aylarca trafik getirir. Ücretsiz.

**Topluluklar** — Nişinin toplandığı forum ve gruplar. Dikkat: doğrudan reklam çoğu yerde yasaktır ve ters teper. Önce katkı ver, satış sonra gelir.

## Neyi ölçeceksin

Satış sayısını değil, **dönüşüm oranını** izle. 100 ziyaretçi gelip hiç satış olmuyorsa sorun trafikte değil; fiyatta, görselde veya güvende. Daha fazla trafik almak o sorunu çözmez, sadece pahalılaştırır.`,
      action_items: [
        'Bir listing seç ve ona küçük bir reklam bütçesi ayır.',
        'İlk 100 ziyaretçi geldiğinde dönüşüm oranını hesapla ve bir yere yaz.',
      ],
    },
    niches: [],
  },

  'Mevsimsel ve tatil dönemi planlaması': {
    findings: [
      {
        title: 'Tatil satışı Kasım\'da değil, Ağustos\'ta kazanılır',
        summary: 'Listing\'in sıralamaya oturması haftalar alır; sezona hazır girmek gerekir.',
        detail:
          'Yeni bir listing arama sonuçlarında yer edinene kadar zaman geçer. Yılbaşı aramaları arttığında listing\'in zaten yayında ve bir miktar veri toplamış olması gerekir. Ayrıca POD\'da üretim + kargo süresi eklenir; sağlayıcılar sezon sonunda sipariş kesim tarihleri ilan eder, o tarihten sonra verilen siparişler yetişmez.',
        category: 'planlama',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Sezon planlaması ve kargo kesim tarihleri',
      level: 2,
      summary: 'Tatil dönemlerine ne zaman ve nasıl hazırlanılır.',
      body_md: `## Geriye doğru planlama

Bir sezona hazırlanırken tarihleri sondan başa doğru koy:

1. **Sezon tarihi** — ör. 24 Aralık.
2. **Kargo kesim tarihi** — sağlayıcının "bu tarihten sonra yetişmez" dediği gün. Genelde sezondan 1-2 hafta önce.
3. **Reklam ve zirve satış dönemi** — kesim tarihinden önceki 3-4 hafta.
4. **Listing yayın tarihi** — zirveden **6-8 hafta önce**. Sıralamaya oturması için gereken süre budur.
5. **Tasarım üretimi** — yayından 2 hafta önce.

Yani yılbaşı için Eylül'de tasarıma başlanır.

## Hangi dönemler değer

Kendi nişine bak: her nişin kendi "yılbaşısı" vardır. Hemşireler için Mayıs, öğretmenler için dönem başı, mezuniyet ürünleri için ilkbahar. Genel tatillerde rekabet çok yoğunken, nişe özel dönemlerde alan boştur.

## Kritik uyarı

Kesim tarihinden sonra gelen siparişleri kabul etmeye devam edersen, "hediyem yetişmedi" yorumları alırsın. Mağaza içi uyarı koy veya o dönemde listing'i geçici kapat.`,
      action_items: [
        'Nişine özel 2 önemli tarih belirle ve her biri için geriye doğru takvim çıkar.',
        'Printify sağlayıcının kargo kesim tarihlerini not al.',
      ],
    },
    niches: [
      { name: 'Öğretmenlere dönem sonu hediyesi', audience: 'ABD, öğrenci velileri', rationale: 'Alıcı ile kullanıcı farklı; veliler öğretmene hediye arar, fiyat duyarlılığı düşük.', demand: 6, competition: 5, margin: 7, seasonality: 'Dönem başı ve sonu keskin zirve' },
    ],
  },

  // ------------------------------------------------------------------- urun

  'Başlangıç için en kârlı ürün tipleri': {
    findings: [
      {
        title: 'Ürün tipi iade ve şikayet oranını belirler',
        summary: 'Beden içeren ürünler daha çok iade alır; bedensiz ürünler daha güvenlidir.',
        detail:
          'Tişört ve hoodie gibi giyilebilir ürünlerde "beden tutmadı" en yaygın iade sebebidir ve bunu tasarımla önleyemezsin. Kupa, poster, tote çanta gibi bedensiz ürünlerde bu risk yoktur. Yeni başlayan biri için bedensiz ürünler daha az sürprizli bir başlangıçtır; giyilebilirler ise daha büyük pazara açılır.',
        category: 'urun',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Hangi ürünle başlamalı?',
      level: 1,
      summary: 'Tişört, kupa, poster ve tote çantanın risk/kâr dengesi.',
      body_md: `## Karşılaştırma

**Tişört / hoodie** — En büyük pazar, en çok arama. Ama beden karmaşası, varyant kalabalığı ve iade riski en yüksek burada. Baz maliyeti yüksek olduğu için satış fiyatı da yüksek olmak zorunda.

**Kupa** — Bedensiz, tek varyant, düşük baz maliyet. Kırılabilir olması kargo riskidir. Hediye olarak çok satar.

**Poster / baskı** — En yüksek yüzde marj, sıfır beden sorunu. Ama alıcı çerçeve beklentisi ve kargoda kırışma riski taşır.

**Tote çanta** — Bedensiz, hafif, kargo ucuz. Pazar tişörtten küçük ama rekabet de daha seyrek.

## Başlangıç için mantıklı olan

**Bedensiz bir ürünle başla.** Sebebi kâr değil, öğrenme hızı: beden ve iade değişkenlerini denklemden çıkarınca tasarımının satıp satmadığını temiz görürsün. Tasarım tuttuğunda aynı tasarımı tişörte taşımak kolaydır.

## Değişmez kural

Hangi ürünü seçersen seç, **satışa açmadan önce kendine bir numune sipariş et.** Baskı kalitesi ve kumaş hissi ancak elde anlaşılır.`,
      action_items: [
        'Bedensiz bir ürün tipi seç ve Printify kataloğunda 2-3 sağlayıcıyı karşılaştır.',
        'Seçtiğin ürün için bir numune sipariş et.',
      ],
    },
    niches: [],
  },

  'Fiyatlandırma ve kâr marjı': {
    findings: [
      {
        title: 'Kâr, satış fiyatından değil, kalemler düşüldükten sonra kalandır',
        summary: 'Baz maliyet + kargo + komisyon + reklam hesaba katılmazsa marj hayalidir.',
        detail:
          'Formül basittir: Satış fiyatı − (baz maliyet + kargo + kanal komisyonu + ödeme komisyonu + reklam + iade payı) = kâr. Yeni satıcıların en yaygın hatası yalnızca baz maliyeti düşüp "yüzde 60 kâr ediyorum" sanmaktır. Komisyonlar ve reklam eklendiğinde bu oran sık sık yarıya iner.',
        category: 'finans',
        confidence: 'yuksek',
      },
    ],
    lesson: {
      title: 'Fiyatlandırma ve kâr hesabı',
      level: 1,
      summary: 'Bir POD ürününde paranın nereye gittiğini kalem kalem gör.',
      body_md: `## Maliyet kalemleri

1. **Baz maliyet** — ürün + baskı, Printify'a ödediğin.
2. **Kargo** — sağlayıcıya ve ülkeye göre değişir; aynı siparişte ikinci üründe düşer.
3. **Kanal komisyonu** — pazaryerinin aldığı pay.
4. **Ödeme komisyonu** — kart işlem ücreti, ayrı bir kalem.
5. **Reklam** — kullanıyorsan satış başına maliyeti hesaba kat.
6. **İade / yeniden baskı payı** — cironun küçük ama sıfır olmayan bir yüzdesi.

## Çarpan yaklaşımı

Yaygın başlangıç kuralı **baz maliyetin ~2 ila 2.5 katı**dır. Bunun altındaysan reklam verecek payın kalmaz; çok üstündeysen dönüşüm düşer. Bu bir başlangıç noktasıdır, kanun değil — kendi rakamlarınla doğrula.

## Fiyat testi ne zaman yapılır

Trafik azken fiyat testi yanıltır. Günde 30-50 ziyaretçiye ulaşmadan iki fiyatı karşılaştırma; gördüğün fark tesadüftür.

## Marjı fiyat artırmadan büyütmek

Aynı siparişte ikinci ürünü satmak kargo maliyetini böler. Bu yüzden "birlikte alınır" ürün çiftleri kurmak, fiyat artırmaktan daha güvenli bir marj hamlesidir.`,
      action_items: [
        'Seçtiğin ürün için 6 maliyet kalemini bir tabloya yaz.',
        'Bir fiyat belirle ve gerçek kâr marjını hesapla.',
      ],
    },
    niches: [],
  },

  'Ölçekleme: ne zaman ürün yelpazesi genişletilir': {
    findings: [
      {
        title: 'Ölçekleme sinyali satış sayısı değil, tekrar eden dönüşümdür',
        summary: 'Tek seferlik satış şans olabilir; istikrarlı dönüşüm oranı sistemdir.',
        detail:
          'Bir nişin çalıştığını gösteren şey, aynı listing\'in haftalarca benzer dönüşüm oranını sürdürmesidir. Tek bir iyi hafta mevsimsel bir dalga olabilir. Ölçeklemeden önce en az birkaç hafta boyunca istikrar aramak, kârlı olmayan bir nişe ürün yığmayı önler.',
        category: 'strateji',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Ne zaman genişlemeli, ne zaman kapatmalı?',
      level: 3,
      summary: 'Ölçekleme ve eleme kararlarının ölçütleri.',
      body_md: `## Genişleme sinyali

Bir nişe yeni ürün eklemenin doğru zamanı, mevcut listing'in **istikrarlı** dönüşüm göstermesidir. Ölçüt olarak şuna bak: birkaç hafta üst üste benzer ziyaretçi/satış oranı. Tek haftalık sıçrama sinyal değil, gürültüdür.

## Genişleme yönü

İki yön var ve karıştırılırsa emek boşa gider:

- **Derinleşme** — Aynı kitleye yeni ürün. Çalışan tasarımı kupaya, posterle, çantaya taşı. Düşük risk, çünkü kitleyi zaten tanıyorsun.
- **Yayılma** — Yeni bir nişe girmek. Yüksek risk, sıfırdan öğrenme.

**Önce derinleş.** Çalışan bir kitleden alacağın ikinci satış, yeni bir kitleden alacağın ilk satıştan çok daha ucuzdur.

## Eleme kararı

Bir listing yeterli trafiği aldığı halde hiç dönüşmüyorsa kapat. "Biraz daha bekleyeyim" en pahalı cümledir: yayında duran ölü listing'ler mağazanın ortalama kalite sinyalini de aşağı çeker.

Kapatmadan önce tek bir şey dene: ilk görseli değiştir. Dönüşümü en çok etkileyen tek değişken odur.`,
      action_items: [
        'Listing\'lerini dönüşüm oranına göre sırala.',
        'En alttaki için ilk görseli değiştir, iki hafta sonra tekrar bak.',
      ],
    },
    niches: [],
  },

  // ---------------------------------------------------------------- tasarim

  'Tasarım üretimi ve baskı dosyası standartları': {
    findings: [
      {
        title: 'Ekran için iyi görünen dosya baskıda dağılır',
        summary: 'Baskı çözünürlüğü ekran çözünürlüğünün kat kat üstündedir.',
        detail:
          'Web görselleri 72 DPI ile iyi görünür; baskı genelde 300 DPI ister. Küçük bir görseli büyütmek çözünürlük kazandırmaz, sadece bulanıklaştırır. Bu yüzden tasarımı en baştan hedef baskı boyutunda ve yüksek çözünürlükte üretmek gerekir. Şeffaf zemin (PNG) da şarttır: beyaz zeminli dosya renkli kumaşta beyaz kutu olarak basılır.',
        category: 'tasarim',
        confidence: 'yuksek',
      },
    ],
    lesson: {
      title: 'Baskıya hazır dosya nasıl olur?',
      level: 2,
      summary: 'DPI, boyut, şeffaflık ve yapay zeka ile üretimde dikkat edilecekler.',
      body_md: `## Dört kural

1. **Yüksek çözünürlük** — Baskı için 300 DPI standarttır. Tasarımı hedef baskı boyutunda üret; sonradan büyütme işe yaramaz.
2. **Şeffaf zemin** — PNG olarak, arka planı gerçekten şeffaf. Beyaz zemin renkli üründe beyaz dikdörtgen olarak basılır.
3. **Baskı alanına uy** — Her ürünün sağlayıcı tarafından tanımlı bir baskı alanı vardır. Taşan tasarım kırpılır.
4. **Kontrast** — Koyu kumaşa koyu tasarım kaybolur. Tasarımı hangi renk üründe satacaksan ona göre kur.

## Yapay zeka ile üretirken

Görsel üreten araçlar POD için çok işe yarar ama iki tuzağı vardır:

- **Çözünürlük** — Çoğu araç varsayılan olarak baskıya yetmeyen boyutta üretir. Yüksek çözünürlük ayarını açıkça iste.
- **Zemin** — "Şeffaf zemin, mockup değil, baskıya hazır" ifadesini prompt'a koy. Aksi halde sana ürün fotoğrafı üretir, baskı dosyası değil.

Programın **Ürünler** sekmesindeki görsel prompt'ları bu iki kuralı zaten içerir.

## Teslim öncesi kontrol

Dosyayı %100 yakınlaştırıp kenarlara bak. Pürüzlü kenar veya gri hale varsa şeffaflık düzgün değildir.`,
      action_items: [
        'Bir tasarım üret ve %100 zoom ile kenarlarını kontrol et.',
        'Printify\'a yükleyip önizlemede baskı alanına oturup oturmadığına bak.',
      ],
    },
    niches: [],
  },

  'Mockup ve ürün görselleri': {
    findings: [
      {
        title: 'İlk görsel dönüşümü diğer tüm görsellerden fazla etkiler',
        summary: 'Arama sonucunda alıcı sadece ilk kareyi görür; tıklama kararı orada verilir.',
        detail:
          'Pazaryeri aramasında listing\'in tek bir küçük karesi görünür. Başlık ve fiyat ikinci plandadır. Bu yüzden ilk görsel düz bir ürün mockup\'ı yerine bağlam içeren bir kare olmalı: ürün giyilirken, kullanılırken veya bir ortamda. Bağlam alıcının kendini o üründe hayal etmesini sağlar.',
        category: 'gorsel',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Dönüşüm getiren ürün görselleri',
      level: 2,
      summary: 'Kaç görsel, hangi sırayla, hangi tipte olmalı.',
      body_md: `## Görsel sırası

**1. Bağlam karesi** — Ürün kullanımda. En kritik kare, tıklamayı bu getirir.
**2. Düz ürün** — Tasarımın net göründüğü temiz kare. Alıcı detayı burada inceler.
**3. Yakın çekim** — Baskı dokusu ve kalite. Güven verir.
**4. Ölçü / beden tablosu** — İade oranını düşüren tek görsel budur.
**5. Renk seçenekleri** — Varsa alternatifler.

## Sık yapılan hata

Beş adet neredeyse aynı mockup koymak. Her görsel **farklı bir soruyu** cevaplamalı: nasıl görünür, ne yazıyor, kalitesi nasıl, bana olur mu, başka rengi var mı.

## Ölçü tablosunu atlama

Giyilebilir üründe iadelerin büyük kısmı beden kaynaklıdır ve ölçü görseli bunu doğrudan azaltır. POD'da iade maliyeti sana kalır — bu görsel doğrudan para kazandırır.

## Test etme

İlk görseli değiştirmek, fiyatı değiştirmekten daha hızlı sonuç verir. Dönüşümü düşük bir listing'de önce burayı dene.`,
      action_items: [
        'Mevcut bir listing için beş görselin her birinin hangi soruyu cevapladığını yaz.',
        'Eksik olanı (çoğunlukla ölçü tablosu) ekle.',
      ],
    },
    niches: [],
  },

  // -------------------------------------------------------------------- seo

  'Etsy listing SEO': {
    findings: [
      {
        title: 'Başlığın ilk kelimeleri en değerli alandır',
        summary: 'Arama sonucunda ve mobilde başlığın yalnızca başı görünür.',
        detail:
          'Başlığı "ana anahtar kelime + ürün tipi + kime/hangi durum için" kalıbıyla kur. Anahtar kelimeleri virgülle yığmak yerine alıcının gerçekten aradığı doğal ifadeyi kullan. Etiket alanlarının hepsini doldur, ama etiketleri başlıkla birebir tekrarlamak yerine eş anlamlı ve uzun kuyruk varyasyonlarla kapsama alanını genişlet.',
        category: 'seo',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Etsy listing SEO temelleri',
      level: 1,
      summary: 'Başlık, etiket ve görsel üçlüsünün arama sıralamasındaki rolü.',
      body_md: `## Arama nasıl çalışır

Pazaryeri önce **eşleşme** (başlık + etiket + kategori), sonra **kalite** (tıklanma, favori, dönüşüm) bakar. Yani listing metni seni arama sonucuna sokar, **ilk görsel** seni tıklattırır, fiyat ve yorumlar satışı kapatır. Üçü ayrı işlerdir.

## Pratik kurallar

- **Başlık:** Kalıp — \`Ana kelime + ürün + hedef kitle/durum\`. En önemli kelime en başta.
- **Etiketler:** Hepsini kullan. Tek kelimelik genel etiketler yerine 2-3 kelimelik uzun kuyruk ifadeler daha iyi dönüşür, çünkü rekabet seyrek ve niyet nettir.
- **Açıklama:** İlk iki cümle arama snippet'ine girer. Ürünün kime ne fayda sağladığını orada söyle, özellik listesini aşağıya bırak.

## Sık yapılan hata

Aynı anahtar kelimeyi başlıkta, etiketlerde ve açıklamada tekrarlamak. Bu sıralamayı yükseltmez, sadece kapsama alanını daraltır — çünkü aynı aramayı üç kez hedeflemiş olursun. Her alanı **farklı** bir arama ifadesini yakalamak için kullan.

## Ölçme

Listing kurduktan sonra 2 hafta bekle. Gösterim var ama tıklama yoksa sorun görselde; tıklama var ama satış yoksa sorun fiyatta veya güvende.`,
      action_items: [
        'Rakip 10 listing\'in başlığını bir tabloya çıkar, tekrar eden kelimeleri işaretle.',
        'Kendi listing\'in için etiket listesi hazırla; çoğu uzun kuyruk olsun.',
      ],
    },
    niches: [],
  },

  'Shopify mağazası ve SEO': {
    findings: [
      {
        title: 'Shopify\'da SEO ürün sayfasında değil, içerikte kazanılır',
        summary: 'Ürün sayfaları binlerce benzeriyle yarışır; içerik sayfaları rekabetsiz aramaları yakalar.',
        detail:
          'POD ürün sayfaları birbirine çok benzediği için arama motorunda ayrışmak zordur. Kendi mağazanda trafik getiren şey genelde çevresel içeriktir: rehberler, karşılaştırmalar, hediye listeleri. Bunlar niş aramalarda sıralanır ve ziyaretçiyi ürüne yönlendirir.',
        category: 'seo',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'Shopify: kendi mağazanın işi farklıdır',
      level: 3,
      summary: 'Pazaryerinden kendi mağazaya geçerken neyin değiştiği.',
      body_md: `## Temel fark

Etsy'de **arama içindesin**, Shopify'da **aramayı sen yaratırsın**. Bu, işin değiştiği anlamına gelir: listing optimizasyonu yerine trafik üretimi.

## Ne zaman geçilir

Shopify aylık sabit maliyettir. Bu maliyeti karşılayacak düzenli satışın yoksa erkendir. Doğru zaman: pazaryerinde istikrarlı satış ve tekrar eden müşteri sinyali gördüğünde.

## Trafiği ne getirir

- **İçerik** — Nişine dair rehberler, hediye listeleri. Yavaş ama birikimli.
- **E-posta** — Kendi mağazanın en büyük avantajı müşteri listesine sahip olmandır. Pazaryerinde bu liste senin değildir.
- **Sosyal** — Görsel platformlar POD ile doğal uyumlu.

## Teknik minimum

Sade ve hızlı bir tema, mobil uyum, net kargo/iade sayfaları, ürün sayfalarında benzersiz açıklama. Printify entegrasyonu resmî uygulama üzerinden kurulur; siparişler otomatik akar.

## En büyük kazanç

Müşteri listesi. Pazaryerinde satarsın ve müşteri pazaryerinin olur; kendi mağazanda müşteri senin olur. Uzun vadede fark burada birikir.`,
      action_items: [
        'Shopify\'a geçmek için hedef bir aylık satış sayısı belirle.',
        'Nişin için üç içerik başlığı yaz (rehber veya hediye listesi).',
      ],
    },
    niches: [],
  },

  // -------------------------------------------------------------- operasyon

  'Printify kurulum ve üretici seçimi': {
    findings: [
      {
        title: 'Aynı ürün, farklı üreticide farklı çıkar',
        summary: 'Printify üretimi print provider\'lara dağıtır; kalite ve süre sağlayıcıya bağlıdır.',
        detail:
          'Printify kendi üretmez, anlaşmalı üreticilere yönlendirir. Aynı blueprint\'i (ürün tipini) birden fazla sağlayıcı basar ve baskı kalitesi, kumaş, üretim süresi, kargo maliyeti ve hata oranı sağlayıcıdan sağlayıcıya değişir. Sağlayıcı seçimi, ürün seçimi kadar önemli bir karardır.',
        category: 'operasyon',
        confidence: 'yuksek',
      },
      {
        title: 'Müşteriye giden ilk ürün, senin görmediğin ürün olmamalı',
        summary: 'Numune siparişi ilk olumsuz yorumu önleyen en ucuz sigortadır.',
        detail:
          'Satışa açmadan önce numune sipariş edip baskı netliğini, renk sapmasını, kumaş ağırlığını ve yıkama sonrası durumu görmek gerekir. Yeni satıcıların ilk olumsuz yorumları neredeyse her zaman kalite kaynaklıdır ve ilk yorumlar mağazanın sonraki dönüşümünü uzun süre etkiler.',
        category: 'operasyon',
        confidence: 'yuksek',
      },
    ],
    lesson: {
      title: 'Printify kurulumu ve üretici seçimi',
      level: 1,
      summary: 'Blueprint ve print provider kavramları, seçim ölçütleri.',
      body_md: `## İki kavram

**Blueprint** = ürün tipi (belirli bir tişört modeli, kupa, poster).
**Print provider** = o ürünü basan üretici. Bir blueprint'i çoğu zaman birden fazla sağlayıcı basar.

Printify kendi üretmez, aracıdır. Yani kaliteyi belirleyen asıl karar **sağlayıcı seçimidir**.

## Sağlayıcı seçerken bak

1. **Konum** — Hedef pazarına yakın sağlayıcı = ucuz ve hızlı kargo. ABD'ye satacaksan ABD'deki sağlayıcı seç.
2. **Üretim süresi** — Sağlayıcının belirttiği gün sayısı, kargo süresinin üstüne eklenir.
3. **Puan** — Printify sağlayıcıları puanlar. Düşük puan genelde kalite veya gecikme demektir.
4. **Varyant genişliği** — İhtiyacın olan renk ve bedenler o sağlayıcıda var mı?
5. **Baz maliyet** — En ucuz her zaman en kârlı değildir; iade ve yeniden baskı maliyetini de düşün.

## Değişmez adım

Seçtiğin kombinasyonla **kendine bir numune sipariş et.** Bu adımı atlamak, yeni satıcıların en pahalı hatasıdır: ilk olumsuz yorum uzun süre peşini bırakmaz.`,
      action_items: [
        'Bir blueprint seç ve en az 3 sağlayıcıyı konum, süre ve puana göre karşılaştır.',
        'Seçtiğin kombinasyonla numune sipariş et, kaliteyi not al.',
      ],
    },
    niches: [],
  },

  'Telif hakkı ve marka riskleri': {
    findings: [
      {
        title: 'Telif ihlali listing kaldırmakla kalmaz, hesap kapatır',
        summary: 'Tekrarlanan ihlal bildirimi mağazanın tamamen kapanmasına yol açabilir.',
        detail:
          'Marka sahipleri pazaryerlerine otomatik tarama yaptırır ve ihlal bildirimi gönderir. İlk bildirimde listing kaldırılır; tekrarında hesap askıya alınabilir. POD\'da bu risk yüksektir çünkü popüler karakter, film ve marka referansları kolay satar — ve tam olarak bu yüzden taranır.',
        category: 'risk',
        confidence: 'yuksek',
      },
    ],
    lesson: {
      title: 'Telif ve marka: neye dokunulmaz',
      level: 2,
      summary: 'İş kurmadan önce bilinmesi gereken tek konu bu.',
      body_md: `## Dokunma listesi

- **Karakterler** — film, dizi, çizgi film, oyun karakterleri. Çizimi senin olsa bile karakter korumalıdır.
- **Marka isim ve logoları** — spor kulüpleri, şirketler, ürün markaları.
- **Slogan ve tescilli ifadeler** — Kısa ve masum görünen bir ifade tescilli olabilir.
- **Gerçek kişiler** — sporcu, müzisyen, oyuncu isimleri ve görüntüleri.
- **Başkasının tasarımı** — internette bulduğun görsel, aksi kanıtlanana kadar korumalıdır.

## Güvenli alan

**Jenerik duygu ve durum.** "Kedisini çok seven insan" korumalı değildir; belirli bir çizgi film kedisi korumalıdır. Meslek mizahı, hobi göndermeleri, yaşam anları — bunlar serbest ve zaten daha iyi satar, çünkü kitleye özel dil kurarlar.

## Emin değilsen

Tescil sorgusu yapabilirsin, ama pratik kural şudur: **bir ifadeyi "bunu herkes biliyor" diye seçiyorsan, muhtemelen birine aittir.** Tanınırlıktan gelen satış, tam olarak riskin kaynağıdır.

## Programın yaklaşımı

Ürün ajanına telif ihlali üretmemesi açıkça talimat verilmiştir — marka, karakter ve gerçek kişi isimleri kullanmaz.`,
      action_items: [
        'Tasarım fikirlerini gözden geçir; marka veya karakter göndermesi varsa çıkar.',
        'Şüpheli bir ifade varsa tescil sorgusu yap.',
      ],
    },
    niches: [],
  },

  'Müşteri hizmetleri ve iade politikası': {
    findings: [
      {
        title: 'POD\'da müşteri hizmetleri gecikmeyi yönetmektir',
        summary: 'Üretim + kargo süresi stoklu satıştan uzundur; beklenti önden kurulmalıdır.',
        detail:
          'Sipariş verildikten sonra ürün önce basılır, sonra kargolanır. Bu, alıcının alıştığı hızlı teslimattan uzundur. Şikayetlerin önemli kısmı üründen değil, karşılanmayan hız beklentisinden doğar. Teslim süresini listing\'de açıkça yazmak, sonradan özür dilemekten ucuzdur.',
        category: 'operasyon',
        confidence: 'orta',
      },
    ],
    lesson: {
      title: 'İade, hasar ve gecikme yönetimi',
      level: 2,
      summary: 'Sorun çıktığında ne yapılır, maliyeti kim üstlenir.',
      body_md: `## Üç sorun tipi, üç farklı cevap

**Baskı hatası / hasarlı ürün** — Bu üreticinin hatasıdır. Printify'a fotoğrafla bildirim açarsın; genelde yeniden baskı veya iade ile çözülür. Müşteriye hemen yenisini gönder, sonra süreci arkada işlet.

**Yanlış beden** — Bu senin hatan değildir ama iadesi senin sorunundur. Çözüm önlemededir: ölçü tablosu görseli koy.

**Gecikme** — En sık şikayet. Beklentiyi listing'de önden kur.

## Politikanı önceden yaz

Sipariş gelmeden önce şunları netleştir: hangi durumda yenisini gönderirsin, hangi durumda para iadesi, hangi durumda hiçbiri. Anlık karar vermek hem tutarsızlık hem para kaybettirir.

## Ekonomik gerçek

Ucuz bir üründe tartışmak yerine yenisini göndermek çoğu zaman daha kârlıdır. Bir olumsuz yorumun dönüşüme maliyeti, tek bir ürünün maliyetinden büyüktür.

## Beklenti yönetimi

Listing'e gerçekçi teslim aralığı yaz ve sipariş sonrası bilgilendirme gönder. "Ürününüz basılıyor" mesajı, şikayetlerin önemli kısmını daha doğmadan bitirir.`,
      action_items: [
        'İade ve yeniden gönderim politikanı üç maddede yaz.',
        'Listing açıklamana gerçekçi teslim süresi ekle.',
      ],
    },
    niches: [],
  },
};

/** Demo modunda gündeme sonradan eklenen, içeriği yazılmamış konular için. */
const fallback = {
  findings: [],
  lesson: {
    title: 'Demo modunun sınırı',
    level: 1,
    summary: 'Bu konu canlı araştırma gerektiriyor — API anahtarı bağlanınca cevaplanır.',
    body_md: `## Neden bu ders çıktı?

Program şu an **demo modunda**: içerik önceden yazılmış temel POD bilgisinden geliyor ve yalnızca başlangıç gündemindeki konuları kapsıyor.

Bu konu o listede yok. Demo modunda uydurma cevap üretmek yerine bunu söylemeyi tercih ediyoruz — yanlış bilgiyle iş kurmak, bilgisiz kalmaktan pahalıdır.

## Nasıl açılır

\`~/ALAS/.env\` dosyasına \`ANTHROPIC_API_KEY\` ekleyip programı kapatıp açtığında:

- Her konu canlı web araştırmasıyla, **kaynak linkleriyle** cevaplanır.
- Komisyon oranları, baz maliyetler gibi değişken bilgiler güncel gelir.
- Ajan kendi takip sorularını gündeme ekleyip **kendi kendine öğrenmeye** başlar.

Demo modu programı tanıman için var; asıl iş anahtar bağlanınca başlıyor.`,
    action_items: [
      'console.anthropic.com adresinden API anahtarı al.',
      '~/ALAS/.env dosyasına ekle ve ALAS\'ı kapatıp aç.',
    ],
  },
  niches: [],
};

export function demoResearch(topic) {
  const base = byTopic[topic.title] ?? fallback;
  return {
    ...structuredClone(base),
    // Demo modunda takip sorusu üretmiyoruz: cevaplanamayacak konularla
    // gündemi şişirmenin anlamı yok. Bu döngü API anahtarıyla açılır.
    next_questions: [],
    sources: [{ title: 'Demo içerik — API anahtarı bağlanınca canlı araştırma yapılır', url: 'https://printify.com/app/help' }],
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
        price_suggestion: 'Baz maliyetin ~2.2 katı (kesin rakam için canlı araştırma gerekir)',
      },
    ],
  };
}
