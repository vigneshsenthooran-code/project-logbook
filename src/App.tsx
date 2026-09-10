import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore, setActiveStorage } from './store';
import AppShell from './components/AppShell';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import ProjectDetail from './views/ProjectDetail';
import SearchResults from './views/SearchResults';
import Settings from './views/Settings';
import LoadingScreen from './components/LoadingScreen';
import { getStorageMode, setStorageMode } from './storage/mode';
import { supabase } from './lib/supabaseClient';
import { supabaseAdapter } from './storage/supabaseAdapter';

// Sign-in is disabled for now — everyone lands in local guest mode. Existing
// devices already signed into a cloud account keep working if their session
// is still valid; otherwise they're quietly dropped back to local.
export default function App() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);
  const [authChecked, setAuthChecked] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      const mode = getStorageMode();
      if (mode === 'cloud') {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setActiveStorage(supabaseAdapter);
        } else {
          setStorageMode('local');
        }
      } else if (mode === undefined) {
        setStorageMode('local');
      }
      setAuthChecked(true);
      void init();
    })();
  }, [init]);

  if (!minTimeElapsed || !authChecked || !ready) {
    return <LoadingScreen />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
