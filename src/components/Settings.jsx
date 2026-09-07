import { useState } from 'react';
import { api } from '../api';
import { Panel, Button, Tag, Loading, Markdown } from './ui';
import { useLoader } from '../hooks';

export function Settings() {
  const status = useLoader(api.status);
  const [printify, setPrintify] = useState(null);
  const [busy, setBusy] = useState(false);

  const testPrintify = async () => {
    setBusy(true);
    try {
      setPrintify(await api.printifyStatus());
    } catch (e) {
      setPrintify({ connected: false, reason: e.message });
    } finally {
      setBusy(false);
    }
  };

  const s = status.data;

  return (
    <div className="stack">
      <Loading {...status}>
        {s && (
          <Panel title="Bağlantılar" subtitle="Anahtarlar .env dosyasında tutulur, panele girilmez.">
            <ul className="list">
              <li className="list-item">
                <div>
                  <div className="row gap">
                    <strong>Anthropic (araştırma + öğretme motoru)</strong>
                    <Tag tone={s.ai.connected ? 'good' : 'warn'}>{s.ai.connected ? 'bağlı' : 'demo modu'}</Tag>
                  </div>
                  <p className="muted small">Model: {s.ai.model} · derinlik: {s.ai.effort}</p>
                </div>
              </li>
              <li className="list-item">
                <div>
                  <div className="row gap">
                    <strong>Printify</strong>
                    <Tag tone={s.printify.connected ? 'good' : 'warn'}>
                      {s.printify.connected ? 'token var' : 'bağlı değil'}
                    </Tag>
                  </div>
                  <p className="muted small">Mağaza ID: {s.printify.shopId ?? '—'}</p>
                  {printify && (
                    <p className={printify.connected ? 'muted small' : 'error'}>
                      {printify.connected
                        ? `Bağlantı başarılı. Mağazalar: ${printify.shops.map((sh) => `${sh.title} (${sh.id})`).join(', ')}`
                        : `⚠ ${printify.reason}`}
                    </p>
                  )}
                </div>
                <Button busy={busy} onClick={testPrintify}>Bağlantıyı test et</Button>
              </li>
            </ul>
          </Panel>
        )}
      </Loading>

      <Panel title="Kurulum" subtitle="Sırayla yapman gerekenler">
        <Markdown text={SETUP} />
      </Panel>

      {s && (
        <Panel title="Profil" subtitle="Ajan araştırmayı ve dersleri buna göre kişiselleştirir (.env ile değişir)">
          <dl className="kv">
            <dt>Satış kanalları</dt><dd>{s.profile.channels.join(', ')}</dd>
            <dt>Hedef pazar</dt><dd>{s.profile.market}</dd>
            <dt>İçerik dili</dt><dd>{s.profile.language}</dd>
            <dt>Bütçe</dt><dd>{s.profile.budget}</dd>
            <dt>Deneyim</dt><dd>{s.profile.experience}</dd>
            <dt>Otomatik araştırma</dt><dd>{s.research.cron === 'off' ? 'kapalı' : s.research.cron}</dd>
          </dl>
        </Panel>
      )}
    </div>
  );
}

const SETUP = `### 1. Yapay zekayı bağla

1. \`console.anthropic.com\` → API Keys → yeni anahtar oluştur.
2. Proje kökünde \`.env\` dosyası aç (\`.env.example\` dosyasını kopyalayabilirsin).
3. \`ANTHROPIC_API_KEY=sk-ant-...\` satırını ekle.
4. Sunucuyu yeniden başlat: \`npm run dev\`.

Bu adımdan sonra her araştırma canlı web aramasıyla yapılır ve kaynak linkleri gelir.

### 2. Printify hesabını aç

1. \`printify.com\` üzerinden ücretsiz hesap aç.
2. Account → Connections → **Pop-Up Store**'u etkinleştir (ücretsiz, kart istemez).
3. Account → **API** → Personal Access Token oluştur.
4. \`.env\` içine \`PRINTIFY_API_TOKEN=...\` ekle, sunucuyu yeniden başlat.
5. Bu sayfada "Bağlantıyı test et" ile mağaza ID'ni öğren, \`PRINTIFY_SHOP_ID\` olarak ekle.

### 3. İlk döngüyü çalıştır

1. **Araştır** sekmesinde ilk konuyu çalıştır.
2. **Öğren** sekmesinde çıkan dersi oku.
3. **Nişler** sekmesinde bir niş seç, ürün fikri üret.
4. **Ürünler** sekmesindeki görsel prompt'unu bir görsel üretim aracında çalıştır, çıkan PNG'yi Printify'a yükle.
5. Kendine bir numune sipariş et — kaliteyi görmeden satışa açma.

### Maliyet notu

Araştırma başına yaklaşık birkaç sent ile birkaç on sent arasında API maliyeti oluşur (derinlik ayarına göre).
\`ANTHROPIC_EFFORT=medium\` yaparak düşürebilir, \`xhigh\` ile derinleştirebilirsin.`;
