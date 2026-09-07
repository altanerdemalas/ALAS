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
