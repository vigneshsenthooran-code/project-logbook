import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { toDateKey } from '../lib/id';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarWidget() {
  const events = useStore((s) => s.events);
  const addEvent = useStore((s) => s.addEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);

  const [view, setView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const eventsByDate = useMemo(() => {
    const m = new Map<string, typeof events>();
    for (const e of events) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [events]);

  const first = new Date(view.year, view.month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function shift(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  function keyFor(day: number): string {
    return toDateKey(new Date(view.year, view.month, day));
  }

  function addForSelected() {
    if (!selected || !title.trim()) return;
    void addEvent(title.trim(), selected);
    setTitle('');
  }

  const selectedEvents = selected ? eventsByDate.get(selected) ?? [] : [];

  return (
    <section className="panel card">
      <div className="cal-head">
        <h3 className="panel-title t-title">{monthLabel}</h3>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <button className="cal-nav-btn" onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="cal-weekday t-caption-sm muted">
            {w}
          </div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cal-cell cal-empty" />;
          const key = keyFor(d);
          const has = eventsByDate.has(key);
          return (
            <button
              key={i}
              className={`cal-cell ${key === todayKey ? 'is-today' : ''} ${
                key === selected ? 'is-selected' : ''
              }`}
              onClick={() => setSelected(key)}
            >
              {d}
              {has && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="cal-events">
          <div className="t-caption-sm muted">{selected}</div>
          {selectedEvents.map((e) => (
            <div key={e.id} className="cal-event">
              <span>{e.title}</span>
              <button className="todo-del" onClick={() => deleteEvent(e.id)} aria-label="Delete event">
                ×
              </button>
            </div>
          ))}
          <div className="cal-add">
            <input
              className="input"
              placeholder="Add event…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addForSelected()}
            />
            <button className="btn btn-primary btn-pill" onClick={addForSelected}>
              Add
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
