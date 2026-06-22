import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store';
import AppShell from './components/AppShell';
import Dashboard from './views/Dashboard';
import Browse from './views/Browse';
import Settings from './views/Settings';

export default function App() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
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
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
