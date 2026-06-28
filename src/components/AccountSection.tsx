import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getStorageMode, setStorageMode } from '../storage/mode';
import { setActiveStorage, useStore } from '../store';
import { indexedDbAdapter } from '../storage/indexedDbAdapter';

export default function AccountSection() {
  const mode = getStorageMode() ?? 'local';
  const [user, setUser] = useState<{ email?: string; createdAt?: string } | null>(null);
  const projectCount = useStore((s) => s.projects.length);
  const entryCount = useStore((s) => s.entries.length);

  useEffect(() => {
    if (mode === 'cloud') {
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) setUser({ email: data.user.email, createdAt: data.user.created_at });
      });
    }
  }, [mode]);

  async function signOut() {
    if (!confirm('Sign out? This device switches to local-only storage; your cloud data stays in your account.')) return;
    await supabase.auth.signOut();
    setStorageMode('local');
    setActiveStorage(indexedDbAdapter);
    useStore.setState({ ready: false });
    await useStore.getState().init();
  }

  return (
    <section className="settings-section">
      <h2 className="t-display-sm">Account</h2>
      <div className="settings-rows">
        <div className="settings-row">
          <span className="settings-row-label">Signed in as</span>
          <span className="settings-row-value">{mode === 'cloud' ? user?.email ?? '…' : 'Guest'}</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Storage</span>
          <span className="settings-row-value">{mode === 'cloud' ? 'Cloud sync' : 'This device only'}</span>
        </div>
        {mode === 'cloud' && user?.createdAt && (
          <div className="settings-row">
            <span className="settings-row-label">Member since</span>
            <span className="settings-row-value">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        )}
        <div className="settings-row">
          <span className="settings-row-label">Logbook</span>
          <span className="settings-row-value">
            {projectCount} {projectCount === 1 ? 'project' : 'projects'} · {entryCount}{' '}
            {entryCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {mode === 'cloud' ? (
        <button className="btn btn-secondary" onClick={() => void signOut()}>
          Sign out
        </button>
      ) : (
        <p className="t-body-sm muted">
          You're using Quire as a guest. Create an account with “Move to cloud” under Storage to sync across devices.
        </p>
      )}
    </section>
  );
}
