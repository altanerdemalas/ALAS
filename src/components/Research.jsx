import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty } from './ui';
import { useLoader, yerelZaman } from '../hooks';

export function Research() {
  const topics = useLoader(api.topics);
  const findings = useLoader(api.findings);
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({ title: '', question: '', track: 'pazar', priority: 2 });
  const [error, setError] = useState('');

  const run = async (topicId) => {
    setBusyId(topicId);
    setError('');
    try {
      await api.research(topicId);
      await Promise.all([topics.reload(), findings.reload()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const addTopic = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.question.trim()) return;
    await api.addTopic(form);
    setForm({ title: '', question: '', track: form.track, priority: 2 });
    topics.reload();
  };

  const toggle = async (topic) => {
    await api.updateTopic(topic.id, { active: !topic.active });
    topics.reload();
  };

  return (
    <div className="stack">
      {error && <p className="error">⚠ {error}</p>}

      <Panel title="Araştırma gündemi" subtitle="Ajan bu kuyruktan sırayla çalışır. Bulduğu her yeni soruyu kuyruğun sonuna kendisi ekler.">
        <Loading {...topics}>
          <ul className="list">
            {(topics.data ?? []).map((t) => (
              <li key={t.id} className={`list-item ${t.active ? '' : 'dim'}`}>
                <div>
                  <div className="row gap">
                    <strong>{t.title}</strong>
                    <Tag>{t.track}</Tag>
                    <Tag tone={t.priority <= 1 ? 'good' : 'neutral'}>öncelik {t.priority}</Tag>
                    {t.last_run_at && <span className="muted small">son: {yerelZaman(t.last_run_at, { tarihli: true })}</span>}
                  </div>
                  <p className="muted small">{t.question}</p>
                </div>
                <div className="row">
                  <Button busy={busyId === t.id} onClick={() => run(t.id)}>Araştır</Button>
                  <Button variant="ghost" onClick={() => toggle(t)}>{t.active ? 'Duraklat' : 'Aktif et'}</Button>
                </div>
              </li>
            ))}
          </ul>
        </Loading>

        <form className="inline-form" onSubmit={addTopic}>
          <input
            placeholder="Konu başlığı"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Ajanın cevaplamasını istediğin soru"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
          <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
            {['pazar', 'urun', 'tasarim', 'seo', 'operasyon', 'genel'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Button type="submit">Gündeme ekle</Button>
        </form>
      </Panel>

      <Panel title="Bilgi tabanı" subtitle="Araştırmalardan çıkan doğrulanmış bulgular">
        <Loading {...findings}>
          {(findings.data ?? []).length === 0 ? (
            <Empty>Henüz bulgu yok. Yukarıdaki konulardan birini araştır.</Empty>
          ) : (
            <ul className="cards">
              {findings.data.map((f) => (
                <li key={f.id} className="card">
                  <div className="row gap">
                    <strong>{f.title}</strong>
                    <Tag tone={f.confidence === 'yuksek' ? 'good' : f.confidence === 'dusuk' ? 'warn' : 'neutral'}>
                      güven: {f.confidence}
                    </Tag>
                    {f.category && <Tag>{f.category}</Tag>}
                  </div>
                  <p>{f.summary}</p>
                  {f.detail && <p className="muted small">{f.detail}</p>}
                  {f.sources?.length > 0 && (
                    <div className="sources">
                      {f.sources.slice(0, 4).map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{hostname(s.url)}</a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Loading>
      </Panel>
    </div>
  );
}

const hostname = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};
