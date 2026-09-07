import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty } from './ui';
import { useLoader } from '../hooks';
import { useState } from 'react';

export function Dashboard({ onNavigate }) {
  const status = useLoader(api.status);
  const actions = useLoader(api.actions);
  const [busy, setBusy] = useState('');

  const runResearch = async () => {
    setBusy('research');
    try {
      await api.research();
      await Promise.all([status.reload(), actions.reload()]);
    } finally {
      setBusy('');
    }
  };

  const refreshPlan = async () => {
    setBusy('plan');
    try {
      await api.refreshActions();
      await actions.reload();
    } finally {
      setBusy('');
    }
  };

  const setStatus = async (id, next) => {
    await api.setActionStatus(id, next);
    await Promise.all([actions.reload(), status.reload()]);
  };

  const s = status.data;
  const open = (actions.data ?? []).filter((a) => a.status === 'acik' || a.status === 'yapiliyor');

  return (
    <Loading {...status}>
      {s && (
        <>
          {!s.ai.connected && (
            <div className="notice">
              <strong>Demo modundasın.</strong> Ajan şu an elle yazılmış temel içerikle çalışıyor.
              <code>.env</code> dosyasına <code>ANTHROPIC_API_KEY</code> ekleyip sunucuyu yeniden
              başlattığında canlı web araştırması ve kişiselleştirilmiş dersler devreye girer.{' '}
              <button className="linkish" onClick={() => onNavigate('ayarlar')}>Kurulum adımları →</button>
            </div>
          )}

          <div className="stat-grid">
            <Stat label="Bilgi tabanı" value={s.counts.findings} unit="bulgu" onClick={() => onNavigate('arastir')} />
            <Stat label="Dersler" value={s.counts.lessons} unit={`${s.counts.lessons_new} okunmadı`} onClick={() => onNavigate('ogren')} />
            <Stat label="Niş adayı" value={s.counts.niches} unit="fikir" onClick={() => onNavigate('nisler')} />
            <Stat label="Ürün fikri" value={s.counts.ideas} unit="taslak" onClick={() => onNavigate('urunler')} />
          </div>

          <div className="split">
            <Panel
              title="Sıradaki adımlar"
              subtitle="Ajanın mevcut duruma bakarak önerdiği görevler"
              actions={<Button busy={busy === 'plan'} onClick={refreshPlan}>Planı yenile</Button>}
            >
              <Loading {...actions}>
                {open.length === 0 ? (
                  <Empty>Açık görev yok. "Planı yenile" ile ajandan yeni adımlar iste.</Empty>
                ) : (
                  <ul className="list">
                    {open.map((a) => (
                      <li key={a.id} className="list-item">
                        <div>
                          <div className="row gap">
                            <strong>{a.title}</strong>
                            <Tag tone={a.effort === 'kucuk' ? 'good' : a.effort === 'buyuk' ? 'warn' : 'neutral'}>
                              {a.effort}
                            </Tag>
                          </div>
                          {a.detail && <p className="muted small">{a.detail}</p>}
                        </div>
                        <div className="row">
                          <Button variant="ghost" onClick={() => setStatus(a.id, 'bitti')}>Bitti</Button>
                          <Button variant="ghost" onClick={() => setStatus(a.id, 'iptal')}>Atla</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Loading>
            </Panel>

            <div className="stack">
              <Panel
                title="Araştırma ajanı"
                subtitle={s.research.cron === 'off' ? 'Otomatik tur kapalı' : `Otomatik tur: ${s.research.cron}`}
                actions={<Button busy={busy === 'research'} onClick={runResearch}>Şimdi araştır</Button>}
              >
                {s.research.next ? (
                  <div className="next-topic">
                    <span className="muted small">Sıradaki konu</span>
                    <strong>{s.research.next.title}</strong>
                    <p className="muted small">{s.research.next.question}</p>
                  </div>
                ) : (
                  <Empty>Gündemde aktif konu kalmadı. Araştır sekmesinden yeni soru ekle.</Empty>
                )}
              </Panel>

              <Panel title="Son hareketler">
                {s.recentEvents.length === 0 ? (
                  <Empty>Henüz hareket yok.</Empty>
                ) : (
                  <ul className="feed">
                    {s.recentEvents.map((e) => (
                      <li key={e.id}>
                        <Tag tone={e.type === 'error' ? 'bad' : 'neutral'}>{e.type}</Tag>
                        <span>{e.message}</span>
                        <time className="muted small">{e.created_at.slice(5, 16)}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </Loading>
  );
}

function Stat({ label, value, unit, onClick }) {
  return (
    <button className="stat" onClick={onClick}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-unit">{unit}</span>
    </button>
  );
}
