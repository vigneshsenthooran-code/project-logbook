import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getStorageMode, setStorageMode } from '../storage/mode';
import { setActiveStorage, useStore } from '../store';
import { supabaseAdapter } from '../storage/supabaseAdapter';
import { indexedDbAdapter } from '../storage/indexedDbAdapter';

export default function StorageSection() {
  const mode = getStorageMode() ?? 'local';
  const [email, setEmail] = useState<string | undefined>();
  const [showSignIn, setShowSignIn] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === 'cloud') {
      void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email));
    }
  }, [mode]);

  async function reload(adapter: typeof indexedDbAdapter | typeof supabaseAdapter) {
    setActiveStorage(adapter);
    useStore.setState({ ready: false });
    await useStore.getState().init();
  }

  async function moveToCloud() {
    setError(undefined);
    setBusy(true);
    try {
      let { error: authError } = await supabase.auth.signInWithPassword(form);
      if (authError) {
        ({ error: authError } = await supabase.auth.signUp(form));
      }
      if (authError) throw authError;
      const bundle = await useStore.getState().exportBundle();
      await supabaseAdapter.importAll(bundle);
      setStorageMode('cloud');
      await reload(supabaseAdapter);
      setShowSignIn(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not move data to the cloud.');
    } finally {
      setBusy(false);
    }
  }

  async function switchToLocal() {
    if (!confirm('Switch to local-only storage? Your cloud data stays in your account; this device will use its local copy instead.')) {
      return;
    }
    await supabase.auth.signOut();
    setStorageMode('local');
    await reload(indexedDbAdapter);
  }

  return (
    <section className="settings-section">
      <h2 className="t-display-sm">Storage</h2>
      {mode === 'cloud' ? (
        <>
          <p className="t-body-sm muted">Signed in as {email ?? '…'}. Your logbook syncs to the cloud.</p>
          <button className="btn btn-secondary" onClick={() => void switchToLocal()}>
            Switch to local only
          </button>
        </>
      ) : (
        <>
          <p className="t-body-sm muted">
            Storing locally on this device only. Move your logbook to the cloud to sync it across devices.
          </p>
          {!showSignIn ? (
            <button className="btn btn-primary" onClick={() => setShowSignIn(true)}>
              Move to cloud
            </button>
          ) : (
            <div className="card" style={{ padding: 16, maxWidth: 320 }}>
              <input
                className="input"
                style={{ marginBottom: 8, width: '100%' }}
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="input"
                style={{ marginBottom: 8, width: '100%' }}
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {error && (
                <p className="t-body-sm" style={{ color: 'var(--color-danger, #d33)', marginBottom: 8 }}>
                  {error}
                </p>
              )}
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={moveToCloud} disabled={busy}>
                {busy ? 'Moving…' : 'Sign in / sign up and move data'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
