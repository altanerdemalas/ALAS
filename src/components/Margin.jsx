import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty } from './ui';
import { useLoader } from '../hooks';

/**
 * Kâr hesabı: baz maliyet Printify kataloğundan çekilir, komisyonlar
 * kaynağı belli oranlardan hesaplanır. Buradaki hiçbir sayı tahmin değildir.
 */
export function Margin() {
  const status = useLoader(api.status);
  const channels = useLoader(api.channels);

  const [form, setForm] = useState({
    basePrice: '', shippingCost: '', salePrice: '', shippingCharged: '',
    channel: 'etsy', adRate: '0', targetMarginPct: '30',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const hesapla = async (event) => {
    event?.preventDefault();
    if (!(Number(form.basePrice) > 0)) {
      setError('Baz maliyet gerekli — Printify kataloğundan çekebilir veya elle girebilirsin.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setResult(await api.calcMargin({
        basePrice: Number(form.basePrice),
        shippingCost: Number(form.shippingCost) || 0,
        salePrice: Number(form.salePrice) || 0,
        shippingCharged: Number(form.shippingCharged) || 0,
        channel: form.channel,
        adRate: (Number(form.adRate) || 0) / 100,
        targetMarginPct: Number(form.targetMarginPct) || 30,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const fee = channels.data?.[form.channel];

  return (
    <div className="stack">
      <Panel title="Kâr hesabı" subtitle="Baz maliyet + kargo + komisyon düşülünce cebine ne kalıyor">
        <form className="margin-form" onSubmit={hesapla}>
          <div className="margin-grid">
            <Field label="Printify baz maliyeti" suffix="$" value={form.basePrice}
              onChange={(v) => setForm({ ...form, basePrice: v })} hint="Katalogdan çek (aşağıda)" />
            <Field label="Printify kargo" suffix="$" value={form.shippingCost}
              onChange={(v) => setForm({ ...form, shippingCost: v })} />
            <Field label="Satış fiyatı" suffix="$" value={form.salePrice}
              onChange={(v) => setForm({ ...form, salePrice: v })} hint="Boş bırakırsan önerilen fiyatı hesaplarım" />
            <Field label="Müşteriden alınan kargo" suffix="$" value={form.shippingCharged}
              onChange={(v) => setForm({ ...form, shippingCharged: v })} hint="0 = ücretsiz kargo" />
            <label className="field-block">
              <span className="field-label">Kanal</span>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                {Object.entries(channels.data ?? { etsy: { label: 'Etsy' } }).map(([key, c]) => (
                  <option key={key} value={key}>{c.label}</option>
                ))}
              </select>
            </label>
            <Field label="Reklam payı" suffix="%" value={form.adRate}
              onChange={(v) => setForm({ ...form, adRate: v })} hint="Satış başına reklam maliyeti" />
            <Field label="Hedef marj" suffix="%" value={form.targetMarginPct}
              onChange={(v) => setForm({ ...form, targetMarginPct: v })} />
          </div>

          {error && <p className="error">⚠ {error}</p>}
          <Button type="submit" busy={busy}>Hesapla</Button>
        </form>

        {fee && (
          <p className="muted small">
            {fee.label} oranları: listeleme ${fee.listing.toFixed(2)} · işlem %{(fee.transactionPct * 100).toFixed(1)} ·
            ödeme %{(fee.paymentPct * 100).toFixed(1)} + ${fee.paymentFlat.toFixed(2)}
            {' · '}<a href={fee.source} target="_blank" rel="noreferrer">kaynak</a> ({fee.verifiedAt} doğrulaması)
            {fee.uncertain && ' · bu kanalda kesinti değişebilir, doğrula'}
          </p>
        )}
      </Panel>

      {result && <Sonuc result={result} />}

      <Loading {...status}>
        {status.data && <KatalogSecici bagli={status.data.printify.connected} onSec={(v) =>
          setForm((f) => ({ ...f, basePrice: String(v.basePrice) }))} />}
      </Loading>
    </div>
  );
}

function Sonuc({ result }) {
  const zarar = result.profit !== undefined && result.profit < 0;

  return (
    <Panel title="Sonuç">
      {result.items && (
        <>
          <table className="hesap">
            <tbody>
              <tr className="gelir">
                <td>Müşterinin ödediği</td>
                <td>${result.buyerPays.toFixed(2)}</td>
              </tr>
              {result.items.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td className="gider">−${item.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="toplam">
                <td>Kâr</td>
                <td className={zarar ? 'gider' : 'kar'}>
                  {zarar ? '−' : ''}${Math.abs(result.profit).toFixed(2)} ({result.marginPct}%)
                </td>
              </tr>
            </tbody>
          </table>

          {zarar && <p className="error">⚠ Bu fiyat zarar ettiriyor.</p>}

          {result.breakEvenPrice && (
            <p className="muted small">
              Başabaş fiyat: <strong>${result.breakEvenPrice.toFixed(2)}</strong> — bunun altında her satış zarar.
            </p>
          )}
        </>
      )}

      {result.suggestedPrice && (
        <p className="oneri">
          Hedef marj için önerilen fiyat: <strong>${result.suggestedPrice.toFixed(2)}</strong>
        </p>
      )}
    </Panel>
  );
}

/** Printify kataloğundan gerçek baz maliyeti çeker. */
function KatalogSecici({ bagli, onSec }) {
  const [blueprintId, setBlueprintId] = useState('');
  const [providers, setProviders] = useState(null);
  const [variants, setVariants] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const blueprints = useLoader(() => (bagli ? api.blueprints() : Promise.resolve([])), [bagli]);

  if (!bagli) {
    return (
      <Panel title="Printify kataloğu">
        <p className="muted small">
          Printify token'ı eklersen baz maliyetleri elle girmek yerine katalogdan çekebilirsin.
          Şimdilik maliyeti Printify panelinden bakıp yukarıya yazabilirsin.
        </p>
      </Panel>
    );
  }

  const secBlueprint = async (id) => {
    setBlueprintId(id);
    setVariants(null);
    setProviders(null);
    if (!id) return;
    setBusy('providers');
    setError('');
    try {
      setProviders(await api.blueprintProviders(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const secProvider = async (providerId) => {
    setBusy(`v-${providerId}`);
    setError('');
    try {
      const data = await api.variants(blueprintId, providerId);
      setVariants(data.variants ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <Panel title="Printify kataloğu" subtitle="Gerçek baz maliyeti buradan çek">
      {error && <p className="error">⚠ {error}</p>}
      <Loading {...blueprints}>
        <select value={blueprintId} onChange={(e) => secBlueprint(e.target.value)}>
          <option value="">Ürün tipi seç…</option>
          {(blueprints.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      </Loading>

      {busy === 'providers' && <p className="empty">Üreticiler yükleniyor…</p>}

      {providers && (
        <ul className="list">
          {providers.slice(0, 8).map((p) => (
            <li key={p.id} className="list-item">
              <div>
                <strong>{p.title}</strong>
                {p.location?.country && <p className="muted small">{p.location.country}</p>}
              </div>
              <Button variant="ghost" busy={busy === `v-${p.id}`} onClick={() => secProvider(p.id)}>
                Maliyetleri gör
              </Button>
            </li>
          ))}
        </ul>
      )}

      {variants && (
        variants.length === 0 ? <Empty>Bu üretici için varyant dönmedi.</Empty> : (
          <ul className="list">
            {variants.slice(0, 12).map((v) => (
              <li key={v.id} className="list-item">
                <div className="row gap">
                  <span>{v.title}</span>
                  <Tag tone="good">${v.basePrice.toFixed(2)}</Tag>
                </div>
                <Button variant="ghost" onClick={() => onSec(v)}>Hesaba aktar</Button>
              </li>
            ))}
          </ul>
        )
      )}
    </Panel>
  );
}

function Field({ label, value, onChange, suffix, hint }) {
  return (
    <label className="field-block">
      <span className="field-label">{label}</span>
      <span className="input-suffix">
        <input type="number" step="0.01" min="0" value={value} onChange={(e) => onChange(e.target.value)} />
        {suffix && <em>{suffix}</em>}
      </span>
      {hint && <span className="muted small">{hint}</span>}
    </label>
  );
}
