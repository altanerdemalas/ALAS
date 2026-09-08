# ALAS — Printify POD Araştırma ve Öğrenme Ajanı

Printify ile stoksuz (print-on-demand) e-ticaret için yapay zeka destekli bir asistan.
Sürekli araştırma yapar, öğrendiğini bilgi tabanına yazar, **sana ders olarak anlatır** ve
araştırmadan çıkan nişleri satılabilir ürün fikirlerine + yayına hazır listing metinlerine çevirir.

## Nasıl çalışır

```
Araştırma gündemi (konu kuyruğu)
        │
        ▼
Araştırma ajanı ── web araması ──▶  Bulgular (kaynaklı)
        │                           Ders (Türkçe, uygulanabilir)
        │                           Niş adayları (skorlu)
        │                           Yeni sorular ──┐
        │                                          │ kuyruğun sonuna eklenir
        │◀─────────────────────────────────────────┘ (kendi kendine öğrenme döngüsü)
        ▼
Ürün ajanı ──▶ Tasarım brief'i + görsel prompt'u + Etsy listing metni
        │
        ▼
Koç ajanı  ──▶ "Bugün şunu yap" görev listesi
```

Her araştırma turu **dört şey** üretir: doğrulanabilir bulgu, bir ders, niş adayları ve
ajanın kendine sorduğu takip soruları. Son madde döngüyü kapatır — gündem kendini büyütür.

## Kurulum

### macOS — tek adım (önerilen)

Terminal'i aç, şunu yapıştır ve Enter'a bas:

```bash
curl -fsSL https://raw.githubusercontent.com/altanerdemalas/ALAS/refs/heads/claude/printify-ai-ecommerce-nfp5vq/scripts/mac-kur.sh | bash
```

Betik Node.js'i kontrol eder (yoksa kurmayı teklif eder), programı `~/ALAS` içine
indirir, bağımlılıkları kurar, paneli derler ve **masaüstüne çift tıklanabilir bir
`ALAS.app` koyar**. Sonrasında sadece ikona tıklarsın.

Masaüstüne iki kısayol koyar: **ALAS** (başlat) ve **ALAS Güncelle** (son sürüme çek,
`data/` ve `.env` korunur). Durdurmak için `~/ALAS/durdur.command` — nadiren gerekir.

### Elle kurulum (her platform)

Node.js 22.5+ gerekir.

```bash
npm install
cp .env.example .env      # anahtarları buraya gir (opsiyonel, aşağıya bak)
npm run dev               # API :3001, panel :5173
```

Üretim için: `npm run build && npm start` (tek sunucu, :3001).

### Demo modu

`ANTHROPIC_API_KEY` yoksa program **çalışmayı sürdürür**: elle yazılmış temel POD içeriğiyle
aynı akışı işletir, panel dolu gelir. Anahtarı ekleyip sunucuyu yeniden başlattığında aynı akış
canlı web araştırmasıyla, kaynak linkleriyle ve kişiselleştirilmiş derslerle çalışır.

### Anahtarlar

| Değişken | Nereden alınır | Zorunlu mu |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Hayır (yoksa demo modu) |
| `PRINTIFY_API_TOKEN` | printify.com → Account → API | Hayır (yoksa katalog kapalı) |
| `PRINTIFY_SHOP_ID` | `GET /api/printify/status` yanıtından | Ürün yüklerken |
| `ETSY_API_KEY` | etsy.com/developers → Register a new app | Hayır (yoksa rekabet tahmini kalır) |
| `MONTHLY_BUDGET_USD` | Panel → Ayarlar | Hayır (0 = sınırsız) |

Profil değişkenleri (`SALES_CHANNELS`, `TARGET_MARKET`, `STARTING_BUDGET`, …) ajanın araştırma
ve ders üretimini kişiselleştirir — açıklamaları `.env.example` içinde.

## Panel

| Sekme | Ne yapar |
|---|---|
| **Panel** | Durum özeti, sıradaki adımlar, API harcaması, araştırmayı elle tetikleme, aktivite akışı |
| **Araştır** | Araştırma gündemi (konu ekle / duraklat / çalıştır) ve kaynaklı bilgi tabanı |
| **Öğren** | Dersler: markdown gövde, "bugün yapılacaklar", okundu/uygulandı takibi |
| **Nişler** | Niş adayları; her skor "ölçüm" ya da "tahmin" olarak işaretli, Etsy ile rekabet ölçümü |
| **Kâr hesabı** | Printify baz maliyeti + kanal komisyonları → kalem kalem kâr, başabaş ve önerilen fiyat |
| **Ürünler** | Tasarım brief'i, görsel prompt'u, listing metni; yayın öncesi kontrol ve Printify'a taslak ürün gönderme |
| **Ayarlar** | Bağlantı durumu, Printify test butonu, adım adım kurulum |

## Ölçüm mü, tahmin mi?

Panel bu ikisini asla karıştırmaz — her sayının yanında hangisi olduğu yazar.

| Skor | Kaynak |
|---|---|
| **Marj** | **Ölçüm.** Printify kataloğundan gerçek baz maliyet + kaynağı belli komisyon oranları. Kâr hesabı sekmesi kalem kalem gösterir. |
| **Rekabet** | Etsy anahtarı varsa **ölçüm** (aktif listing sayısı, fiyat dağılımı, favoriler); yoksa model tahmini. |
| **Talep** | **Tahmin.** Google Trends'in resmi API'si başvuruyla kapalı alfa aşamasında; ücretli servis bağlanmadıkça bu skor model yargısıdır. |

Komisyon oranları `server/lib/margin.js` içinde kaynak ve doğrulama tarihiyle tutulur;
panelde de gösterilir, böylece hangi varsayımla hesaplandığı gizli kalmaz.

## Otomasyon ve maliyet

Ölçülen maliyet: bir araştırma turu **~$0.70** (token + web arama ücreti). Bu yüzden
varsayılanlar bilerek güvenli tarafta:

| Ayar | Varsayılan | Neden |
|---|---|---|
| `RESEARCH_CRON` | `off` | Günlük otomatik tur ayda ~$20-40 tutar. Önce elle çalıştır, maliyeti gör, sonra aç. |
| `TOPICS_PER_RUN` | `1` | Her konu ayrı ücretlendirilir. |
| `MONTHLY_BUDGET_USD` | `10` | Aşılınca **otomatik** turlar durur; elle çalıştırma engellenmez. |

Üçü de **Ayarlar → Otomasyon ve bütçe** bölümünden değiştirilir; değişiklik yeniden
başlatmadan geçerli olur. Erken sürümden gelen kurulumlar açılışta bir kez bu ayarlara
çekilir — ama kendi seçtiğin bir değer varsa ona dokunulmaz ve değişiklik aktivite
akışında bildirilir.

Cron yalnızca sunucu o anda açıkken tetiklenir; ALAS ise uygulama açıldığında başlar.
Bu yüzden açılışta **kaçırılan tur telafi edilir**: son tur `CATCHUP_HOURS`'dan (varsayılan 20)
eskiyse bir tur hemen çalışır.

Panel her turun token ve web arama sayısını kaydeder, aylık tahmini harcamayı gösterir.
Fiyatlar `server/lib/cost.js` içinde kaynak ve doğrulama tarihiyle tutulur.

## Mimari

```
server/
  config.js                  .env okuma, profil, bağlantı durumu
  db.js                      node:sqlite şema + yardımcılar (harici bağımlılık yok)
  seed.js                    14 konuluk başlangıç müfredatı
  lib/ai.js                  Anthropic istemcisi (claude-opus-5 + web_search aracı)
  agents/research.js         konu → bulgu + ders + niş + yeni sorular
  agents/product.js          niş → ürün konsepti + listing metni
  agents/coach.js            durum → sıradaki adımlar
  agents/demo.js             API anahtarı yokken kullanılan temel içerik
  integrations/printify.js   Printify REST v1 istemcisi
  routes/api.js              REST uçları
src/                         React paneli (Vite)
```

Veritabanı `data/alas.db` (SQLite — Node'un yerleşik `node:sqlite` modülü, derleme gerektirmez).

## Yayın akışı

Ürünler sekmesinde her fikir için:

1. **Yayın öncesi kontrol** — telif/marka riski, listing kalitesi (başlık uzunluğu, 13 etiket),
   ve Etsy anahtarı varsa arama hacmi + fiyatın piyasa aralığındaki konumu. Etsy yoksa o
   kontroller "atlandı" der; sessizce "sorun yok" saymaz.
2. **Printify'a gönder** — baskıya hazır PNG'yi yükler, ürün tipi/üretici/varyant seçtirir
   ve **taslak** ürün oluşturur. Tasarımı sen üretirsin; burada yapılan kurulum işidir.

Telif kontrolü bilinen riskli terimleri yakalar, **tescil sorgusu değildir**.

## Sıradaki adımlar

- Satış verisi geri beslemesi: hangi nişin gerçekten sattığını ajana öğretmek. Bu, gerçek
  satış olmadan anlamsız — ilk ürün yayına çıkıp veri birikince yapılacak.
- Görsel üretim entegrasyonu (prompt → PNG), ayrı bir görsel API'si ve ücreti gerektirir.
