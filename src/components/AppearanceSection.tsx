import { useState } from 'react';
import { ACCENTS, getAccent, getThemePref, setAccent, setThemePref, type ThemePref } from '../lib/theme';

const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

export default function AppearanceSection() {
  const [theme, setTheme] = useState<ThemePref>(getThemePref());
  const [accent, setAccentState] = useState<string | null>(getAccent());

  function chooseTheme(t: ThemePref) {
    setTheme(t);
    setThemePref(t);
  }

  function chooseAccent(v: string | null) {
    setAccentState(v);
    setAccent(v);
  }

  return (
    <section className="settings-section">
      <h2 className="t-display-sm">Appearance</h2>

      <div className="field">
        <span className="field-label">Theme</span>
        <div className="segmented">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`segmented-btn ${theme === t.id ? 'is-active' : ''}`}
              onClick={() => chooseTheme(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Accent colour</span>
        <div className="accent-swatches">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              className={`accent-swatch ${(accent ?? null) === a.value ? 'is-active' : ''}`}
              style={{ background: a.value ?? '#9fe870' }}
              onClick={() => chooseAccent(a.value)}
              aria-label={a.label}
              title={a.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
