import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, collectionGroup, doc, query, where } from 'firebase/firestore';
import { db } from './firebase.js';
import { useLiveDoc, useLiveQuery } from './hooks.js';
import { appNow } from '../../../server/clock.js';

// Sample student standing in for the APSpace session.
export const STUDENT_ID = 'TP000000';
const OPEN = ['new', 'preparing'];

const AppData = createContext(null);

function useNow(config) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => appNow(config || {}), [config?.demoTime, tick]);
}

export function AppDataProvider({ children }) {
  const config = useLiveDoc(doc(db, 'config/app'), 'config');
  const now = useNow(config.data);
  const student = useLiveDoc(doc(db, `students/${STUDENT_ID}`), 'student');
  const stalls = useLiveQuery(collection(db, 'stalls'), 'stalls');
  const menuItems = useLiveQuery(collectionGroup(db, 'menuItems'), 'menuItems');
  const openOrders = useLiveQuery(
    query(collection(db, 'orders'), where('date', '==', now.date), where('status', 'in', OPEN)),
    `open-${now.date}`,
  );

  const value = useMemo(() => {
    const stallList = [...stalls.data].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    const stallById = Object.fromEntries(stallList.map((s) => [s.id, s]));

    const menuByStall = {};
    for (const m of menuItems.data) {
      const stallId = m.path.split('/')[1];
      (menuByStall[stallId] ||= []).push({ ...m, stallId });
    }
    for (const list of Object.values(menuByStall)) {
      list.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || a.path.localeCompare(b.path));
    }

    // Pre-order wait = open pre-orders x prep minutes per order (derived, not stored).
    const waitByStall = {};
    for (const s of stallList) {
      const open = openOrders.data.filter((o) => o.stallId === s.id).length;
      waitByStall[s.id] = { open, minutes: open * (s.prepMinPerOrder || 0) };
    }

    const allItems = stallList.flatMap((s) =>
      (menuByStall[s.id] || []).map((m) => ({ ...m, stallName: s.name, cuisine: s.cuisine })));

    return {
      config: config.data || {},
      now,
      student: student.data,
      stalls: stallList,
      stallById,
      menuByStall,
      allItems,
      waitByStall,
      loading: config.loading || student.loading || stalls.loading || menuItems.loading,
      error: config.error || student.error || stalls.error || menuItems.error || openOrders.error,
    };
  }, [config, now, student, stalls, menuItems, openOrders]);

  return <AppData.Provider value={value}>{children}</AppData.Provider>;
}

export function useAppData() {
  const v = useContext(AppData);
  if (!v) throw new Error('useAppData outside AppDataProvider');
  return v;
}
