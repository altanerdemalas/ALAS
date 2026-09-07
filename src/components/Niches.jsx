import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty } from './ui';
import { useLoader } from '../hooks';

export function Niches({ onNavigate }) {
  const niches = useLoader(api.niches);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const generate = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await api.generateIdeas(id, 3);
      onNavigate('urunler');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (id, status) => {
    await api.setNicheStatus(id, status);
    niches.reload();
  };

  return (
    <Panel
      title="Niş adayları"
      subtitle="Skor = talep×0.45 + marj×0.30 + (10−rekabet)×0.25"
    >
      {error && <p className="error">⚠ {error}</p>}
      <Loading {...niches}>
        {(niches.data ?? []).length === 0 ? (
          <Empty>Henüz niş yok. Araştır sekmesinde "pazar" izleğindeki bir konuyu çalıştır.</Empty>
        ) : (
          <ul className="cards">
            {niches.data.map((n) => (
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
                  <Bar label="Talep" value={n.demand} />
                  <Bar label="Rekabet" value={n.competition} invert />
                  <Bar label="Marj" value={n.margin} />
                </div>
                {n.seasonality && <p className="muted small">Mevsimsellik: {n.seasonality}</p>}

                <div className="row">
                  <Button busy={busyId === n.id} onClick={() => generate(n.id)}>Ürün fikri üret</Button>
                  <Button variant="ghost" onClick={() => setStatus(n.id, 'test')}>Test et</Button>
                  <Button variant="ghost" onClick={() => setStatus(n.id, 'elendi')}>Ele</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Loading>
    </Panel>
  );
}

function Bar({ label, value, invert = false }) {
  // Rekabette düşük değer iyidir; renk skalasını ters çeviririz.
  const good = invert ? value <= 4 : value >= 7;
  const bad = invert ? value >= 8 : value <= 3;
  return (
    <div className="bar">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span
          className={`bar-fill ${good ? 'good' : bad ? 'bad' : ''}`}
          style={{ width: `${value * 10}%` }}
        />
      </span>
      <span className="bar-value">{value}</span>
    </div>
  );
}
