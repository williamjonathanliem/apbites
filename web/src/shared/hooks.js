import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

// Live Firestore listeners. `key` must change whenever the ref/query changes.

export function useLiveDoc(ref, key) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!ref) return undefined;
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.exists() ? { id: snap.id, ...snap.data() } : null, loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export function useLiveQuery(query, key) {
  const [state, setState] = useState({ data: [], loading: true, error: null });
  useEffect(() => {
    if (!query) return undefined;
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      query,
      (snap) => setState({
        data: snap.docs.map((d) => ({ id: d.id, path: d.ref.path, ...d.data() })),
        loading: false,
        error: null,
      }),
      (error) => setState({ data: [], loading: false, error }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}
