import { useState } from 'react';

/** Small top-right hint bubble explaining what the floating composer accepts. */
export default function ComposerHint() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="composer-hint"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="composer-hint-toggle"
        aria-label="What can I capture here?"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <div className="composer-hint-tooltip" role="tooltip">
          Start typing, drop in a file or image, paste a link and organise your work.
        </div>
      )}
    </div>
  );
}
