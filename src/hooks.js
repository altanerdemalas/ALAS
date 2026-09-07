import { useEffect, useState } from 'react';

/** Veri çeken sayfalar için tek satırlık yükle/hata/yenile sarmalayıcı. */
export function useLoader(loadFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const reload = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      setState({ data: await loadFn(), loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload };
}

/**
 * Sunucu zaman damgalarını (UTC, ISO 8601) tarayıcının yerel saatine çevirir.
 * Saat dilimi işareti olmayan eski kayıtlar da UTC kabul edilir — SQLite
 * datetime('now') her zaman UTC yazıyordu.
 */
export function yerelZaman(value, { tarihli = false } = {}) {
  if (!value) return '';
  const iso = /[Zz]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    ...(tarihli ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
}
