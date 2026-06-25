import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore, setActiveStorage } from './store';
import AppShell from './components/AppShell';
import Dashboard from './views/Dashboard';
import Browse from './views/Browse';
import Projects from './views/Projects';
import Settings from './views/Settings';
import AuthScreen from './views/AuthScreen';
import { getStorageMode } from './storage/mode';
import { supabase } from './lib/supabaseClient';
import { supabaseAdapter } from './storage/supabaseAdapter';

export default function App() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);
  const [authChecked, setAuthChecked] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    (async () => {
      const mode = getStorageMode();
      if (mode === 'cloud') {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setActiveStorage(supabaseAdapter);
        } else {
          setNeedsAuth(true);
          setAuthChecked(true);
          return;
        }
      } else if (mode === undefined) {
        setNeedsAuth(true);
        setAuthChecked(true);
        return;
      }
      setAuthChecked(true);
      void init();
    })();
  }, [init]);

  if (needsAuth) {
    return (
      <AuthScreen
        onDone={() => {
          setNeedsAuth(false);
          void init();
        }}
      />
    );
  }

  if (!authChecked || !ready) {
    return (
      <div className="boot">
        <div className="boot-mark">Quire</div>
        <div className="muted t-body-sm">Opening your logbook…</div>
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
