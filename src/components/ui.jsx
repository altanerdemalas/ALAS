import { useState } from 'react';

export function Panel({ title, subtitle, actions, children }) {
  return (
    <section className="panel">
      {(title || actions) && (
        <header className="panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Button({ busy, children, variant = 'default', ...props }) {
  return (
    <button className={`btn btn-${variant}`} disabled={busy || props.disabled} {...props}>
      {busy ? '…' : children}
    </button>
  );
}

export const Tag = ({ children, tone = 'neutral' }) => <span className={`tag tag-${tone}`}>{children}</span>;

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}

export function Loading({ error, loading, children }) {
  if (loading) return <p className="empty">Yükleniyor…</p>;
  if (error) return <p className="error">⚠ {error}</p>;
  return children;
}

/** Sıfır bağımlılıkla küçük markdown: başlık, kalın, liste, paragraf. */
export function Markdown({ text = '' }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="md">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (/^#{1,6}\s/.test(block)) {
          const level = block.match(/^#+/)[0].length;
          const Heading = `h${Math.min(level + 1, 6)}`;
          return <Heading key={i}>{inline(block.replace(/^#+\s/, ''))}</Heading>;
        }
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s/.test(l))) {
          const ordered = /^\s*\d+\./.test(lines[0]);
          const List = ordered ? 'ol' : 'ul';
          return (
            <List key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s/, ''))}</li>
              ))}
            </List>
          );
        }
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}

/** **kalın**, `kod` ve satır sonlarını işler. */
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

export function CopyButton({ text, label = 'Kopyala' }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? '✓ Kopyalandı' : label}
    </Button>
  );
}
