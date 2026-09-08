import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty } from './ui';
import { useLoader, yerelZaman } from '../hooks';

export function Niches({ onNavigate }) {
  const niches = useLoader(api.niches);
  const status = useLoader(api.status);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const etsyBagli = status.data?.etsy?.connected;

  const generate = async (id) => {
    setBusy(`idea-${id}`);
    setError('');
    try {
      await api.generateIdeas(id, 3);
      onNavigate('urunler');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const measure = async (id) => {
    setBusy(`measure-${id}`);
    setError('');
    try {
      await api.measureNiche(id);
      await niches.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (id, s) => {
    await api.setNicheStatus(id, s);
    niches.reload();
  };

  return (
    <Panel title="Niş adayları" subtitle="Skor = talep×0.45 + marj×0.30 + (10−rekabet)×0.25">
      {error && <p className="error">⚠ {error}</p>}

      {!etsyBagli && (
        <div className="notice">
          Rekabet skorları şu an <strong>model tahmini</strong>. Ayarlar'dan Etsy API anahtarını
          eklersen rekabeti gerçek listing sayısıyla <strong>ölçebilirim</strong>.
        </div>
      )}

      <Loading {...niches}>
        {(niches.data ?? []).length === 0 ? (
          <Empty>Henüz niş yok. Araştır sekmesinde "pazar" izleğindeki bir konuyu çalıştır.</Empty>
        ) : (
          <ul className="cards">
            {niches.data.map((n) => {
              const m = n.measured;
              return (
                <li key={n.id} className="card">
                  <div className="row between">
                    <div className="row gap">
                      <strong>{n.name}</strong>
                      <Tag tone={n.status === 'aktif' ? 'good' : n.status === 'elendi' ? 'bad' : 'neutral'}>{n.status}</Tag>
                    </div>
                    <span className="score" title="Toplam skor (0-10)">{n.score}</span>
                  </div>

                  {n.audience && <p className="muted small">Kitle: {n.audience}</p>}
                  {n.rationale && <p>{n.rationale}</p>}

                  <div className="bars">
                    <Bar label="Talep" value={n.demand} kaynak={null} />
                    <Bar label="Rekabet" value={n.competition} invert kaynak={m?.competition} />
                    <Bar label="Marj" value={n.margin} kaynak={null} />
                  </div>

                  {m && (
                    <div className="olcum">
                      <div className="row gap">
                        <Tag tone="good">ölçüm</Tag>
                        <span className="muted small">
                          Etsy · "{m.competition.keyword}" · {yerelZaman(n.measured_at, { tarihli: true })}
                        </span>
                      </div>
                      <ul className="olcum-liste">
                        <li><strong>{m.competition.detail}</strong> — rekabet skoru bundan hesaplandı</li>
                        {m.price && <li>Fiyat: {m.price.detail}</li>}
                        {m.interest && <li>İlgi: {m.interest.detail}</li>}
                      </ul>
                    </div>
                  )}

                  {n.seasonality && <p className="muted small">Mevsimsellik: {n.seasonality}</p>}

                  <div className="row">
                    <Button busy={busy === `idea-${n.id}`} onClick={() => generate(n.id)}>Ürün fikri üret</Button>
                    <Button
                      variant="ghost"
                      busy={busy === `measure-${n.id}`}
                      onClick={() => measure(n.id)}
                      disabled={!etsyBagli}
                      title={etsyBagli ? 'Etsy verisiyle rekabeti ölç' : 'Etsy anahtarı gerekli'}
                    >
                      {m ? 'Yeniden ölç' : 'Rekabeti ölç'}
                    </Button>
                    <Button variant="ghost" onClick={() => setStatus(n.id, 'test')}>Test et</Button>
                    <Button variant="ghost" onClick={() => setStatus(n.id, 'elendi')}>Ele</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Loading>
    </Panel>
  );
}

/** Ölçülmüş değerler tahmin edilenlerden görsel olarak ayrılır. */
function Bar({ label, value, invert = false, kaynak }) {
  const good = invert ? value <= 4 : value >= 7;
  const bad = invert ? value >= 8 : value <= 3;
  return (
    <div className="bar">
      <span className="bar-label">
        {label}
        <em className={kaynak ? 'kaynak olculen' : 'kaynak'}>{kaynak ? 'ölçüm' : 'tahmin'}</em>
      </span>
      <span className="bar-track">
        <span className={`bar-fill ${good ? 'good' : bad ? 'bad' : ''}`} style={{ width: `${value * 10}%` }} />
      </span>
      <span className="bar-value">{value}</span>
    </div>
  );
}
