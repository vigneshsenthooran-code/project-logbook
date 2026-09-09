import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import ContourBackground from './ContourBackground';
import {
  IconCapture,
  IconCategorize,
  IconBrowse,
  IconProjects,
  IconCalendar,
  IconSettings,
} from './IntroIcons';

const STORAGE_KEY = 'quire-intro-seen';

interface IntroStore {
  isOpen: boolean;
  show: () => void;
  hide: () => void;
}

const useIntroStore = create<IntroStore>((set) => ({
  isOpen: false,
  show: () => set({ isOpen: true }),
  hide: () => set({ isOpen: false }),
}));

/** Imperative trigger for the Topbar's "How it works" menu item. */
export function openIntroWalkthrough() {
  useIntroStore.getState().show();
}

interface Step {
  Icon: ComponentType<{ size?: number }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    Icon: IconCapture,
    title: 'Capture everything, instantly.',
    body: 'The floating entry field — bottom-left, on every page — takes a quick note, an image with a caption, a file, or a link. ⌘/Ctrl+Enter submits without touching the mouse.',
  },
  {
    Icon: IconCategorize,
    title: 'It files itself — you just confirm.',
    body: "On submit, Quire matches your text against each category's keywords and suggests the best fit. You always get a confirm step; no match means it lands in Inbox rather than a silent guess.",
  },
  {
    Icon: IconBrowse,
    title: 'Every entry, one filterable grid.',
    body: 'Entries appear as cards with type, category, and date. Filter by category, search, and sort by newest or by category order. Edit or delete any entry at any time.',
  },
  {
    Icon: IconProjects,
    title: 'One logbook, many projects.',
    body: 'Everything lives inside a project; switch between them from the dashboard, organise them into folders on the Projects page, and export or import a project as a single portable file.',
  },
  {
    Icon: IconCalendar,
    title: 'Plan alongside what you capture.',
    body: 'A calendar and to-do list sit right on the dashboard next to the entry field, so the logbook doubles as a lightweight planner.',
  },
  {
    Icon: IconSettings,
    title: 'Shaped to fit the project.',
    body: 'Switch between the general-purpose preset and the UTS Architecture Design Log preset, or fully customise categories, keywords, colours, and order yourself in Settings.',
  },
];

export default function IntroWalkthrough() {
  const isOpen = useIntroStore((s) => s.isOpen);
  const show = useIntroStore((s) => s.show);
  const hide = useIntroStore((s) => s.hide);
  const [step, setStep] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnPrevRect = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== '1') show();
  }, [show]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      overlayRef.current?.focus();
    }
  }, [isOpen]);

  // The Next button is centered alone on step 1; once Back appears it shares
  // the row and Next's position shifts right. Rather than let that reflow
  // jump instantly, capture Next's position just before the step changes and
  // FLIP it in — instant transform to the old spot, then transition to zero.
  function captureNextRect() {
    nextBtnPrevRect.current = nextBtnRef.current?.getBoundingClientRect() ?? null;
  }

  useLayoutEffect(() => {
    const el = nextBtnRef.current;
    const prev = nextBtnPrevRect.current;
    nextBtnPrevRect.current = null;
    if (!el || !prev) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const newRect = el.getBoundingClientRect();
    const dx = prev.left - newRect.left;
    if (Math.abs(dx) < 0.5) return;
    el.style.transition = 'none';
    el.style.transform = `translateX(${dx}px)`;
    // Force a reflow so the instant jump is committed before the transition
    // below re-enables, otherwise the browser coalesces both into one.
    void el.offsetWidth;
    requestAnimationFrame(() => {
      el.style.transition = '';
      el.style.transform = '';
    });
  }, [step]);

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1');
    hide();
  }

  function goTo(i: number) {
    captureNextRect();
    setStep(i);
  }

  function next() {
    captureNextRect();
    if (step >= STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  }

  function back() {
    captureNextRect();
    setStep((s) => Math.max(0, s - 1));
  }

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (e.key === 'Enter' && target?.tagName !== 'BUTTON') {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === 'Tab') {
        const root = overlayRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const total = STEPS.length;
  const isLast = step === total - 1;
  const current = STEPS[step];

  return createPortal(
    <div
      className="intro-overlay"
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="How Quire works"
    >
      <ContourBackground />

      <button type="button" className="intro-skip" onClick={finish}>
        Skip
      </button>

      <div className="intro-content" key={step}>
        <div className="intro-icon">
          <current.Icon size={96} />
        </div>
        <h2 className="t-display-lg intro-headline">{current.title}</h2>
        <p className="t-body intro-body">{current.body}</p>
      </div>

      <div className="intro-nav">
        <div className="intro-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`intro-dot ${i === step ? 'is-active' : ''}`}
              aria-label={`Go to step ${i + 1} of ${total}`}
              aria-current={i === step}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <div className="intro-buttons">
          {step > 0 && (
            <button type="button" className="btn btn-ghost intro-back" onClick={back}>
              Back
            </button>
          )}
          <button type="button" className="btn btn-primary" ref={nextBtnRef} onClick={next}>
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
