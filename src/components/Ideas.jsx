import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty, CopyButton } from './ui';
import { useLoader } from '../hooks';

export function Ideas() {
  const ideas = useLoader(api.ideas);
  const status = useLoader(api.status);

  const setStatus = async (id, status) => {
    await api.setIdeaStatus(id, status);
    ideas.reload();
  };

  return (
    <Panel title="Ürün fikirleri" subtitle="Tasarım brief'i, görsel prompt'u ve yayına hazır listing metni">
      <Loading {...ideas}>
        {(ideas.data ?? []).length === 0 ? (
          <Empty>Henüz ürün fikri yok. Nişler sekmesinde bir nişte "Ürün fikri üret" butonuna bas.</Empty>
        ) : (
          <ul className="cards">
            {ideas.data.map((idea) => (
              <li key={idea.id} className="card">
                <div className="row between">
                  <div className="row gap">
                    <strong>{idea.title}</strong>
                    <Tag tone={idea.status === 'onaylandi' ? 'good' : idea.status === 'elendi' ? 'bad' : 'neutral'}>
                      {idea.status}
                    </Tag>
                  </div>
                  {idea.niche_name && <Tag>{idea.niche_name}</Tag>}
                </div>

                {idea.blueprint && <p className="muted small">Ürün: {idea.blueprint}</p>}
                {idea.price_suggestion && <p className="muted small">Fiyat: {idea.price_suggestion}</p>}

                <Field label="Tasarım brief'i" text={idea.design_brief} />
                <Field label="Görsel üretim prompt'u" text={idea.image_prompt} mono />
                <Field label="Listing başlığı" text={idea.listing_title} />
                <Field label="Listing açıklaması" text={idea.listing_description} />

                {idea.tags?.length > 0 && (
                  <div className="field">
                    <div className="row between">
                      <span className="field-label">Etiketler ({idea.tags.length})</span>
                      <CopyButton text={idea.tags.join(', ')} />
                    </div>
                    <div className="chips">{idea.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                  </div>
                )}

                <Preflight idea={idea} />

                <Publish idea={idea} printifyBagli={status.data?.printify?.connected} onDone={ideas.reload} />

                <div className="row">
                  <Button onClick={() => setStatus(idea.id, 'onaylandi')}>Onayla</Button>
                  <Button variant="ghost" onClick={() => setStatus(idea.id, 'elendi')}>Ele</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Loading>
    </Panel>
  );
}

/** Yayına çıkmadan önce: telif, listing kalitesi, talep ve fiyat kontrolü. */
function Preflight({ idea }) {
  const [sonuc, setSonuc] = useState(null);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const calistir = async () => {
    setBusy(true);
    setError('');
    try {
      setSonuc(await api.preflight(idea.id, { price: Number(price) || 0 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const rozet = { gecti: 'good', uyari: 'warn', sorun: 'bad', atlandi: 'neutral' };
  const simge = { gecti: '✓', uyari: '!', sorun: '✗', atlandi: '–' };

  return (
    <div className="field">
      <div className="row between">
        <span className="field-label">Yayın öncesi kontrol</span>
        <div className="row gap">
          <input
            type="number" step="0.01" min="0" placeholder="fiyat $" style={{ width: 90 }}
            value={price} onChange={(e) => setPrice(e.target.value)}
          />
          <Button variant="ghost" busy={busy} onClick={calistir}>Kontrol et</Button>
        </div>
      </div>

      {error && <p className="error">⚠ {error}</p>}

      {sonuc && (
        <>
          <ul className="kontrol">
            {sonuc.checks.map((c) => (
              <li key={c.id}>
                <Tag tone={rozet[c.durum]}>{simge[c.durum]}</Tag>
                <div>
                  <strong>{c.baslik}</strong>
                  <p className="muted small">{c.detay}</p>
                  {c.oneri && <p className="small">→ {c.oneri}</p>}
                </div>
              </li>
            ))}
          </ul>
          {sonuc.etsyHatasi && <p className="muted small">Etsy verisi alınamadı: {sonuc.etsyHatasi}</p>}
        </>
      )}
    </div>
  );
}

/** Tasarımı yükleyip Printify'da taslak ürün oluşturur. Tasarımı sen üretirsin. */
function Publish({ idea, printifyBagli, onDone }) {
  const [acik, setAcik] = useState(false);
  const [file, setFile] = useState(null);
  const [blueprintId, setBlueprintId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [variants, setVariants] = useState([]);
  const [secili, setSecili] = useState([]);
  const [price, setPrice] = useState('24.99');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [sonuc, setSonuc] = useState(null);
  const blueprints = useLoader(() => (acik && printifyBagli ? api.blueprints() : Promise.resolve([])), [acik, printifyBagli]);

  if (idea.printify_product_id) {
    return (
      <div className="field">
        <div className="row gap">
          <Tag tone="good">Printify'da oluşturuldu</Tag>
          <span className="muted small">Ürün ID: {idea.printify_product_id}</span>
        </div>
        <p className="muted small">Printify panelinden önizleyip yayına alabilirsin.</p>
      </div>
    );
  }

  if (!printifyBagli) {
    return (
      <div className="field">
        <span className="field-label">Printify'a gönder</span>
        <p className="muted small">Ayarlar'dan Printify token'ını eklersen tasarımı buradan yükleyip taslak ürün oluşturabilirsin.</p>
      </div>
    );
  }

  const secProvider = async (id) => {
    setProviderId(id);
    setSecili([]);
    setBusy('variants');
    try {
      const data = await api.variants(blueprintId, id);
      setVariants(data.variants ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const gonder = async () => {
    if (!file) return setError('Tasarım dosyası seç (baskıya hazır PNG).');
    if (secili.length === 0) return setError('En az bir varyant seç.');
    setBusy('publish');
    setError('');
    try {
      const imageBase64 = await dosyaBase64(file);
      const r = await api.publishIdea(idea.id, {
        fileName: file.name,
        imageBase64,
        blueprintId,
        printProviderId: providerId,
        variants: secili.map((id) => ({ id, price: Number(price) })),
      });
      setSonuc(r);
      await onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="field">
      <div className="row between">
        <span className="field-label">Printify'a gönder</span>
        <Button variant="ghost" onClick={() => setAcik(!acik)}>{acik ? 'Kapat' : 'Aç'}</Button>
      </div>

      {acik && (
        <div className="yayin">
          <label className="field-block">
            <span className="muted small">1. Baskıya hazır tasarım (PNG)</span>
            <input type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files[0])} />
          </label>

          <label className="field-block">
            <span className="muted small">2. Ürün tipi</span>
            <Loading {...blueprints}>
              <select value={blueprintId} onChange={(e) => { setBlueprintId(e.target.value); setVariants([]); setProviderId(''); }}>
                <option value="">Seç…</option>
                {(blueprints.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </Loading>
          </label>

          {blueprintId && <ProviderSec blueprintId={blueprintId} onSec={secProvider} busy={busy === 'variants'} />}

          {variants.length > 0 && (
            <label className="field-block">
              <span className="muted small">3. Varyantlar ({secili.length} seçili)</span>
              <div className="varyantlar">
                {variants.slice(0, 20).map((v) => (
                  <label key={v.id} className="varyant">
                    <input
                      type="checkbox"
                      checked={secili.includes(v.id)}
                      onChange={(e) => setSecili(e.target.checked ? [...secili, v.id] : secili.filter((x) => x !== v.id))}
                    />
                    <span>{v.title}</span>
                    <em className="muted">${v.basePrice.toFixed(2)}</em>
                  </label>
                ))}
              </div>
            </label>
          )}

          <label className="field-block">
            <span className="muted small">4. Satış fiyatı ($) — Kâr hesabı sekmesinden doğrula</span>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: 120 }} />
          </label>

          {error && <p className="error">⚠ {error}</p>}
          {sonuc && <p className="muted small">✓ Oluşturuldu — Printify ürün ID: {sonuc.productId}</p>}

          <Button busy={busy === 'publish'} onClick={gonder}>Taslak ürün oluştur</Button>
          <p className="muted small">
            Ürün Printify'da <strong>taslak</strong> olarak oluşur. Yayına almadan önce
            önizle ve kendine numune sipariş et.
          </p>
        </div>
      )}
    </div>
  );
}

function ProviderSec({ blueprintId, onSec, busy }) {
  const providers = useLoader(() => api.blueprintProviders(blueprintId), [blueprintId]);
  return (
    <label className="field-block">
      <span className="muted small">2b. Üretici</span>
      <Loading {...providers}>
        <select onChange={(e) => e.target.value && onSec(e.target.value)} disabled={busy}>
          <option value="">Seç…</option>
          {(providers.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.title}{p.location?.country ? ` (${p.location.country})` : ''}</option>
          ))}
        </select>
      </Loading>
    </label>
  );
}

/** Dosyayı base64'e çevirir; sunucu bunu Printify'a iletir. */
const dosyaBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function Field({ label, text, mono = false }) {
  if (!text) return null;
  return (
    <div className="field">
      <div className="row between">
        <span className="field-label">{label}</span>
        <CopyButton text={text} />
      </div>
      <p className={mono ? 'mono' : ''}>{text}</p>
    </div>
  );
}
