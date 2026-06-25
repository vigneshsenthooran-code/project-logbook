import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { setStorageMode } from '../storage/mode';
import { setActiveStorage, useStore } from '../store';
import { supabaseAdapter } from '../storage/supabaseAdapter';

export default function AuthScreen({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(undefined);
    setBusy(true);
    try {
      const { error: authError } =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      setStorageMode('cloud');
      setActiveStorage(supabaseAdapter);
      useStore.setState({ ready: false });
      await useStore.getState().init();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    setStorageMode('local');
    onDone();
  }

  return (
    <div className="boot">
      <div className="boot-mark">Quire</div>
      <div className="card" style={{ width: 320, padding: 24, textAlign: 'left' }}>
        <h2 className="t-display-sm" style={{ marginBottom: 4 }}>
          {mode === 'sign-in' ? 'Sign in' : 'Create an account'}
        </h2>
        <p className="t-body-sm muted" style={{ marginBottom: 16 }}>
          Sign in to sync your logbook across devices, or continue without an account.
        </p>
        <input
          className="input"
          style={{ marginBottom: 8, width: '100%' }}
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          style={{ marginBottom: 12, width: '100%' }}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
        />
        {error && (
          <p className="t-body-sm" style={{ color: 'var(--color-danger, #d33)', marginBottom: 8 }}>
            {error}
          </p>
        )}
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }} onClick={submit} disabled={busy}>
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginBottom: 16 }}
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border, #eee)', marginBottom: 16 }} />
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={continueAsGuest}>
          Continue as guest
        </button>
        <p className="t-body-sm muted" style={{ marginTop: 8 }}>
          Guest mode stays on this device only — no account, no sync.
        </p>
      </div>
    </div>
  );
}
