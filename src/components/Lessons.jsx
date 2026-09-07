import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty, Markdown } from './ui';
import { useLoader } from '../hooks';

const LEVELS = { 1: 'temel', 2: 'orta', 3: 'ileri' };

export function Lessons() {
  const lessons = useLoader(api.lessons);
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState('hepsi');

  const setStatus = async (id, status) => {
    await api.setLessonStatus(id, status);
    lessons.reload();
  };

  const visible = (lessons.data ?? []).filter((l) => filter === 'hepsi' || l.status === filter);

  return (
    <Panel
      title="Öğrenme paneli"
      subtitle="Ajanın araştırdıklarından senin için çıkardığı dersler"
      actions={
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {['hepsi', 'yeni', 'okundu', 'uygulandi'].map((f) => <option key={f}>{f}</option>)}
        </select>
      }
    >
      <Loading {...lessons}>
        {visible.length === 0 ? (
          <Empty>Bu filtrede ders yok. Araştır sekmesinden bir konu çalıştır — her araştırma bir ders üretir.</Empty>
        ) : (
          <ul className="lessons">
            {visible.map((l) => (
              <li key={l.id} className="card">
                <button className="lesson-head" onClick={() => setOpenId(openId === l.id ? null : l.id)}>
                  <div>
                    <div className="row gap">
                      <strong>{l.title}</strong>
                      <Tag tone={l.level === 1 ? 'good' : l.level === 3 ? 'warn' : 'neutral'}>{LEVELS[l.level]}</Tag>
                      <Tag tone={l.status === 'yeni' ? 'accent' : 'neutral'}>{l.status}</Tag>
                    </div>
                    <p className="muted small">{l.summary}</p>
                  </div>
                  <span className="chevron">{openId === l.id ? '−' : '+'}</span>
                </button>

                {openId === l.id && (
                  <div className="lesson-body">
                    <Markdown text={l.body_md} />

                    {l.action_items?.length > 0 && (
                      <>
                        <h4>Bugün yapılacaklar</h4>
                        <ul className="checklist">
                          {l.action_items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </>
                    )}

                    {l.sources?.length > 0 && (
                      <div className="sources">
                        <span className="muted small">Kaynaklar:</span>
                        {l.sources.map((s) => (
                          <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                        ))}
                      </div>
                    )}

                    <div className="row">
                      <Button variant="ghost" onClick={() => setStatus(l.id, 'okundu')}>Okudum</Button>
                      <Button onClick={() => setStatus(l.id, 'uygulandi')}>Uyguladım</Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Loading>
    </Panel>
  );
}
