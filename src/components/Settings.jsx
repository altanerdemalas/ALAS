import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Markdown } from './ui';
import { useLoader } from '../hooks';

export function Settings() {
  const status = useLoader(api.status);
  const keys = useLoader(api.keys);

  return (
    <div className="stack">
      <KeyForm status={status} keys={keys} />

      <Loading {...status}>
        {status.data && <PrintifyPanel status={status.data} onSaved={() => { status.reload(); keys.reload(); }} />}
      </Loading>

      <Otomasyon onSaved={() => status.reload()} />

      <Panel title="Nasıl API anahtarı alınır?">
        <Markdown text={SETUP} />
      </Panel>

      <Loading {...status}>
        {status.data && (
          <Panel title="Profil" subtitle="Ajan araştırmayı ve dersleri buna göre kişiselleştirir">
            <dl className="kv">
              <dt>Satış kanalları</dt><dd>{status.data.profile.channels.join(', ')}</dd>
              <dt>Hedef pazar</dt><dd>{status.data.profile.market}</dd>
              <dt>İçerik dili</dt><dd>{status.data.profile.language}</dd>
              <dt>Bütçe</dt><dd>{status.data.profile.budget}</dd>
              <dt>Deneyim</dt><dd>{status.data.profile.experience}</dd>
              <dt>Otomatik araştırma</dt><dd>{status.data.research.cron === 'off' ? 'kapalı' : status.data.research.cron}</dd>
            </dl>
          </Panel>
        )}
      </Loading>
    </div>
  );
}

/** Anahtarları panelden kaydetme — .env dosyasını elle açmaya gerek kalmasın diye. */
function KeyForm({ status, keys }) {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [printifyToken, setPrintifyToken] = useState('');
  const [etsyKey, setEtsyKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const { updated } = await api.saveKeys({ anthropicKey, printifyToken, etsyKey });
      setAnthropicKey('');
      setPrintifyToken('');
      setEtsyKey('');
      setResult({ ok: true, text: `Kaydedildi: ${updated.join(', ')}. Artık canlı çalışıyor.` });
      await Promise.all([status.reload(), keys.reload()]);
    } catch (error) {
      setResult({ ok: false, text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const k = keys.data;
  const nothingTyped = !anthropicKey.trim() && !printifyToken.trim() && !etsyKey.trim();

  return (
    <Panel
      title="API anahtarları"
      subtitle="Anahtarı buraya yapıştır, Kaydet'e bas. Dosya açmana gerek yok."
    >
      <Loading {...keys}>
        {k && (
          <form className="key-form" onSubmit={save}>
            <label className="key-row">
              <div className="row gap">
                <span className="field-label">Anthropic — araştırma ve öğretme motoru</span>
                <Tag tone={k.anthropic.set ? 'good' : 'warn'}>
                  {k.anthropic.set ? `bağlı · ${k.anthropic.masked}` : 'bağlı değil'}
                </Tag>
              </div>
              <input
                type="password"
                placeholder={k.anthropic.set ? 'Değiştirmek için yeni anahtarı yapıştır' : 'sk-ant-...'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
            </label>

            <label className="key-row">
              <div className="row gap">
                <span className="field-label">Printify — ürün kataloğu</span>
                <Tag tone={k.printify.set ? 'good' : 'neutral'}>
                  {k.printify.set ? `bağlı · ${k.printify.masked}` : 'bağlı değil (isteğe bağlı)'}
                </Tag>
              </div>
              <input
                type="password"
                placeholder={k.printify.set ? 'Değiştirmek için yeni token\'ı yapıştır' : 'Printify Personal Access Token'}
                value={printifyToken}
                onChange={(e) => setPrintifyToken(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
            </label>

            <label className="key-row">
              <div className="row gap">
                <span className="field-label">Etsy — rekabet ölçümü</span>
                <Tag tone={k.etsy?.set ? 'good' : 'neutral'}>
                  {k.etsy?.set ? `bağlı · ${k.etsy.masked}` : 'bağlı değil (rekabet tahmine kalır)'}
                </Tag>
              </div>
              <input
                type="password"
                placeholder={k.etsy?.set ? 'Değiştirmek için yeni anahtarı yapıştır' : 'Etsy API keystring'}
                value={etsyKey}
                onChange={(e) => setEtsyKey(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
            </label>

            <div className="row gap">
              <Button type="submit" busy={busy} disabled={nothingTyped}>Kaydet</Button>
              {result && <span className={result.ok ? 'muted small' : 'error'}>{result.ok ? '✓ ' : '⚠ '}{result.text}</span>}
            </div>

            <p className="muted small">
              Anahtarlar bu bilgisayarda <code>~/ALAS/.env</code> dosyasında saklanır, hiçbir yere gönderilmez.
              Panel yalnızca bu bilgisayardan erişilebilir.
            </p>
          </form>
        )}
      </Loading>
    </Panel>
  );
}

/**
 * Otomasyon ve bütçe. Varsayılanlar bilerek güvenli tarafta: otomatik tur
 * kapalı, tur başına 1 konu, aylık $10 sınır. Buradan değiştirilebilir.
 */
const ZAMANLAMALAR = [
  { value: 'off', label: 'Kapalı — sadece elle çalıştır', not: 'Önerilen başlangıç. Maliyet tamamen senin kontrolünde.' },
  { value: '0 7 * * 1', label: 'Haftada bir (Pazartesi 07:00)', not: 'Tur başına ~$0.70 → ayda ~$3' },
  { value: '0 7 * * *', label: 'Her gün (07:00)', not: 'Tur başına ~$0.70 → ayda ~$20 (1 konu ile)' },
];

function Otomasyon({ onSaved }) {
  const automation = useLoader(api.automation);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const a = automation.data;
  const degerler = form ?? (a && { cron: a.cron, topicsPerRun: a.topicsPerRun, monthlyBudget: a.monthlyBudget });

  const kaydet = async (event) => {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      await api.saveAutomation(degerler);
      setResult({ ok: true, text: 'Kaydedildi — hemen geçerli.' });
      setForm(null);
      await Promise.all([automation.reload(), onSaved()]);
    } catch (error) {
      setResult({ ok: false, text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const secili = ZAMANLAMALAR.find((z) => z.value === degerler?.cron);

  return (
    <Panel title="Otomasyon ve bütçe" subtitle="Araştırma ne sıklıkla çalışsın, ne kadar harcasın">
      <Loading {...automation}>
        {degerler && (
          <form className="key-form" onSubmit={kaydet}>
            <label className="key-row">
              <span className="field-label">Otomatik araştırma</span>
              <select value={degerler.cron} onChange={(e) => setForm({ ...degerler, cron: e.target.value })}>
                {ZAMANLAMALAR.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                {!secili && <option value={degerler.cron}>Özel: {degerler.cron}</option>}
              </select>
              {secili && <span className="muted small">{secili.not}</span>}
            </label>

            <div className="margin-grid">
              <label className="field-block">
                <span className="field-label">Tur başına konu</span>
                <input
                  type="number" min="1" max="5"
                  value={degerler.topicsPerRun}
                  onChange={(e) => setForm({ ...degerler, topicsPerRun: Number(e.target.value) })}
                />
                <span className="muted small">Her konu ayrı ücretlendirilir</span>
              </label>

              <label className="field-block">
                <span className="field-label">Aylık sınır ($)</span>
                <input
                  type="number" min="0" step="1"
                  value={degerler.monthlyBudget}
                  onChange={(e) => setForm({ ...degerler, monthlyBudget: Number(e.target.value) })}
                />
                <span className="muted small">0 = sınırsız</span>
              </label>
            </div>

            <div className="row gap">
              <Button type="submit" busy={busy}>Kaydet</Button>
              {result && <span className={result.ok ? 'muted small' : 'error'}>{result.ok ? '✓ ' : '⚠ '}{result.text}</span>}
            </div>

            <p className="muted small">
              Sınır aşıldığında <strong>otomatik</strong> turlar durur; elle "Şimdi araştır"
              çalışmaya devam eder — karar sende kalsın diye.
            </p>
          </form>
        )}
      </Loading>
    </Panel>
  );
}

function PrintifyPanel({ status, onSaved }) {
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState('');

  const runTest = async () => {
    setBusy(true);
    try {
      setTest(await api.printifyStatus());
    } catch (error) {
      setTest({ connected: false, reason: error.message });
    } finally {
      setBusy(false);
    }
  };

  const chooseShop = async (id) => {
    setSaving(id);
    try {
      await api.saveKeys({ shopId: String(id) });
      await onSaved();
    } finally {
      setSaving('');
    }
  };

  return (
    <Panel
      title="Printify mağazası"
      subtitle={status.printify.shopId ? `Seçili mağaza: ${status.printify.shopId}` : 'Henüz mağaza seçilmedi'}
      actions={<Button busy={busy} onClick={runTest} disabled={!status.printify.connected}>Bağlantıyı test et</Button>}
    >
      {!status.printify.connected ? (
        <p className="muted small">Önce yukarıya Printify token'ını kaydet, sonra mağazanı buradan seçebilirsin.</p>
      ) : test ? (
        test.connected ? (
          <ul className="list">
            {test.shops.map((shop) => (
              <li key={shop.id} className="list-item">
                <div>
                  <strong>{shop.title}</strong>
                  <p className="muted small">ID: {shop.id} · {shop.sales_channel}</p>
                </div>
                {String(shop.id) === String(status.printify.shopId) ? (
                  <Tag tone="good">seçili</Tag>
                ) : (
                  <Button busy={saving === shop.id} onClick={() => chooseShop(shop.id)}>Bunu kullan</Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="error">⚠ {test.reason}</p>
        )
      ) : (
        <p className="muted small">Mağazalarını listelemek için "Bağlantıyı test et" düğmesine bas.</p>
      )}
    </Panel>
  );
}

const SETUP = `### Anthropic anahtarı (araştırma motoru)

1. \`console.anthropic.com\` adresine git, hesap aç.
2. Soldaki menüden **API Keys** → **Create Key** → anahtarı kopyala.
3. Hesaba kredi yükle (**Billing** → minimum $5). Anahtar kredisiz çalışmaz.
4. Anahtarı yukarıdaki kutuya yapıştır, **Kaydet**'e bas.

Anahtar bir kez gösterilir; kaybedersen yenisini oluşturman gerekir.

**Maliyet:** Abonelik değil, kullandıkça ödersin. Bir araştırma turu kabaca birkaç sent
ile ~30 sent arası. Günde iki tur çalışan bir kurulum ayda yaklaşık $5-15 tutar.
Yavaşlatmak istersen Panel'deki otomatik turu kapatabilirsin.

### Etsy anahtarı (rekabeti ölçmek için)

1. \`etsy.com/developers\` → **Register a new app**.
2. Uygulama bilgilerini doldur; onay genelde 24-48 saat (satıcı hesabıyla dakikalar).
3. Gelen **keystring**'i yukarıdaki kutuya yapıştır.

Bu anahtar olmadan rekabet skorları model tahmini kalır. Anahtarla birlikte
Nişler sekmesinde "Rekabeti ölç" düğmesi gerçek listing sayısını, fiyat
dağılımını ve favori sayılarını çeker.

### Printify token'ı (isteğe bağlı)

1. \`printify.com\` → hesap aç, **Pop-Up Store**'u etkinleştir (ücretsiz).
2. **Account → Connections → API** → Personal Access Token oluştur.
3. Yukarıdaki kutuya yapıştır, **Kaydet**'e bas.
4. Sonra "Bağlantıyı test et" ile mağazanı seç.

Printify token'ı olmadan da program çalışır; sadece canlı ürün kataloğu kapalı olur.`;
