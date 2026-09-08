import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Research } from './components/Research';
import { Lessons } from './components/Lessons';
import { Niches } from './components/Niches';
import { Ideas } from './components/Ideas';
import { Margin } from './components/Margin';
import { Settings } from './components/Settings';

const TABS = [
  { id: 'panel', label: 'Panel' },
  { id: 'arastir', label: 'Araştır' },
  { id: 'ogren', label: 'Öğren' },
  { id: 'nisler', label: 'Nişler' },
  { id: 'urunler', label: 'Ürünler' },
  { id: 'kar', label: 'Kâr hesabı' },
  { id: 'ayarlar', label: 'Ayarlar' },
];

export default function App() {
  const [tab, setTab] = useState('panel');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◆</span>
          <div>
            <h1>ALAS</h1>
            <p>Printify POD araştırma ve öğrenme ajanı</p>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'tab active' : 'tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {tab === 'panel' && <Dashboard onNavigate={setTab} />}
        {tab === 'arastir' && <Research />}
        {tab === 'ogren' && <Lessons />}
        {tab === 'nisler' && <Niches onNavigate={setTab} />}
        {tab === 'urunler' && <Ideas />}
        {tab === 'kar' && <Margin />}
        {tab === 'ayarlar' && <Settings />}
      </main>
    </div>
  );
}
