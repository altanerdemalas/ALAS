import { api } from '../api';
import { Panel, Button, Tag, Loading, Empty, CopyButton } from './ui';
import { useLoader } from '../hooks';

export function Ideas() {
  const ideas = useLoader(api.ideas);

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

                <div className="row">
                  <Button onClick={() => setStatus(idea.id, 'onaylandi')}>Onayla</Button>
                  <Button variant="ghost" onClick={() => setStatus(idea.id, 'yuklendi')}>Yüklendi işaretle</Button>
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
