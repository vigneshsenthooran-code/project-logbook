import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import type { CalendarEvent } from '../types';
import { INBOX_ID } from '../types';
import { fromDateKey, toDateKey } from '../lib/id';
import { projectColor } from '../lib/projectColor';
import { categoryColor } from '../lib/categories';
import {
  excludeDatesForWeekly,
  expandWeeklyOccurrences,
  isBreakWeek,
  periodEndDate,
  snapToMonday,
  weekLabel,
  weekNumberForDate,
} from '../lib/period';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_MS = 86_400_000;
const NONE_FILTER = '__none__';

type Segment = 'single' | 'start' | 'end' | 'middle';
type Occurrence = { event: CalendarEvent; segment: Segment };

/** Expands every event into per-day occurrences within [rangeStart, rangeEnd], keyed by date. */
function buildOccurrenceMap(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): Map<string, Occurrence[]> {
  const map = new Map<string, Occurrence[]>();
  const add = (key: string, occ: Occurrence) => {
    const arr = map.get(key) ?? [];
    arr.push(occ);
    map.set(key, arr);
  };
  const rangeStartKey = toDateKey(rangeStart);
  const rangeEndKey = toDateKey(rangeEnd);

  for (const e of events) {
    if (e.recurrence?.freq === 'weekly') {
      const dates = expandWeeklyOccurrences(e.date, e.recurrence.until, e.recurrence.excludeDates, rangeStart, rangeEnd);
      for (const d of dates) add(d, { event: e, segment: 'single' });
      continue;
    }
    const end = e.endDate ?? e.date;
    if (end < rangeStartKey || e.date > rangeEndKey) continue;
    let cursor = e.date > rangeStartKey ? fromDateKey(e.date) : rangeStart;
    const stopKey = end < rangeEndKey ? end : rangeEndKey;
    while (toDateKey(cursor) <= stopKey) {
      const key = toDateKey(cursor);
      const segment: Segment = e.date === end ? 'single' : key === e.date ? 'start' : key === end ? 'end' : 'middle';
      add(key, { event: e, segment });
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
  }
  return map;
}

export default function CalendarWidget() {
  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const configsByProject = useStore((s) => s.configsByProject);
  const events = useStore((s) => s.events);
  const period = useStore((s) => s.period);
  const ready = useStore((s) => s.ready);
  const addCalendarItem = useStore((s) => s.addCalendarItem);
  const toggleCalendarEvent = useStore((s) => s.toggleCalendarEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const savePeriod = useStore((s) => s.savePeriod);

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [view, setView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [weekStartDate, setWeekStartDate] = useState(() => snapToMonday(toDateKey(new Date())));
  const [selected, setSelected] = useState<string | null>(null);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set());

  // Add-item form
  const [kind, setKind] = useState<CalendarEvent['kind']>('event');
  const [title, setTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [time, setTime] = useState('');
  const [reminder, setReminder] = useState(false);
  const [formProjectId, setFormProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [repeatsWeekly, setRepeatsWeekly] = useState(false);
  const [until, setUntil] = useState('');

  // Term/period builder
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodInitRef = useRef(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftWeeks, setDraftWeeks] = useState(12);
  const [draftBreaks, setDraftBreaks] = useState<number[]>([]);
  const [draftLabels, setDraftLabels] = useState<Record<number, string>>({});
  const [labelWeekInput, setLabelWeekInput] = useState('');
  const [labelTextInput, setLabelTextInput] = useState('');

  useEffect(() => {
    if (ready && !period && !periodInitRef.current) {
      periodInitRef.current = true;
      setPeriodOpen(true);
    }
  }, [ready, period]);

  useEffect(() => {
    if (period) {
      setDraftStart(period.startDate);
      setDraftWeeks(period.weekCount);
      setDraftBreaks(period.breakWeeks);
      setDraftLabels(period.labels ?? {});
    }
  }, [period]);

  useEffect(() => {
    setFormProjectId((prev) => prev || activeProjectId);
  }, [activeProjectId]);

  const todayKey = toDateKey(new Date());

  function toggleFilter(key: string) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const activeEvents = useMemo(
    () => events.filter((e) => !filters.has(e.projectId ?? NONE_FILTER)),
    [events, filters]
  );

  function projectName(id?: string): string {
    if (!id) return 'No project';
    return projects.find((p) => p.id === id)?.name ?? 'Unknown';
  }

  function categoriesForProject(id: string) {
    return (configsByProject[id]?.categories ?? []).filter((c) => c.id !== INBOX_ID);
  }

  // ---- Month grid ----
  const first = new Date(view.year, view.month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateKey(new Date(view.year, view.month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthOccurrenceMap = useMemo(
    () => buildOccurrenceMap(activeEvents, new Date(view.year, view.month, 1), new Date(view.year, view.month + 1, 0)),
    [activeEvents, view.year, view.month]
  );

  function shiftMonth(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  function openDay(key: string) {
    setSelected(key);
    setFormDate(key);
    setFormEndDate(key);
  }

  function handleCellClick(day: string) {
    if (!rangeAnchor) {
      setRangeAnchor(day);
      openDay(day);
      return;
    }
    const start = rangeAnchor < day ? rangeAnchor : day;
    const end = rangeAnchor < day ? day : rangeAnchor;
    setSelected(start);
    setFormDate(start);
    setFormEndDate(end);
    setRangeAnchor(null);
  }

  // ---- Week view ----
  const weekDays = Array.from({ length: 7 }, (_, i) => toDateKey(new Date(fromDateKey(weekStartDate).getTime() + i * DAY_MS)));
  const weekOccurrenceMap = useMemo(
    () => buildOccurrenceMap(activeEvents, fromDateKey(weekDays[0]), fromDateKey(weekDays[6])),
    [activeEvents, weekStartDate]
  );
  function shiftWeek(delta: number) {
    setWeekStartDate((d) => toDateKey(new Date(fromDateKey(d).getTime() + delta * 7 * DAY_MS)));
  }

  // ---- Agenda (visible month) ----
  const agendaGroups = useMemo(() => {
    const dates = [...monthOccurrenceMap.keys()].sort();
    return dates.map((date) => ({
      date,
      items: [...monthOccurrenceMap.get(date)!].sort((a, b) => (a.event.time ?? '').localeCompare(b.event.time ?? '')),
    }));
  }, [monthOccurrenceMap]);

  function submit() {
    if (!selected || !title.trim()) return;
    let start = formDate || selected;
    let end = kind === 'event' ? formEndDate || start : start;
    if (end < start) [start, end] = [end, start];

    let recurrence: CalendarEvent['recurrence'] | undefined;
    if (kind === 'event' && repeatsWeekly && until) {
      const weekday = fromDateKey(start).getDay();
      const excludeDates = period ? excludeDatesForWeekly(period, weekday, until) : undefined;
      recurrence = { freq: 'weekly', until, excludeDates };
    }

    void addCalendarItem({
      title: title.trim(),
      date: start,
      endDate: kind === 'event' && end !== start ? end : undefined,
      time: time || undefined,
      reminder: reminder || undefined,
      kind,
      done: kind === 'task' ? false : undefined,
      projectId: formProjectId || undefined,
      categoryId: formProjectId && categoryId ? categoryId : undefined,
      recurrence,
    });
    setTitle('');
    setTime('');
    setReminder(false);
    setRepeatsWeekly(false);
    setUntil('');
    setCategoryId('');
  }

  function savePeriodDraft() {
    if (!draftStart || draftWeeks < 1) return;
    void savePeriod({
      startDate: snapToMonday(draftStart),
      weekCount: draftWeeks,
      breakWeeks: draftBreaks,
      labels: Object.keys(draftLabels).length ? draftLabels : undefined,
    });
    setPeriodOpen(false);
  }

  function setLabel() {
    const n = Number(labelWeekInput);
    if (!n || n < 1 || n > draftWeeks) return;
    setDraftLabels((l) => {
      const next = { ...l };
      if (labelTextInput.trim()) next[n] = labelTextInput.trim();
      else delete next[n];
      return next;
    });
    setLabelWeekInput('');
    setLabelTextInput('');
  }

  function renderChip(occ: Occurrence, small: boolean) {
    const { event, segment } = occ;
    const color = projectColor(projects, event.projectId);
    const catColor =
      event.projectId && event.categoryId
        ? categoryColor(configsByProject[event.projectId]?.categories ?? [], event.categoryId)
        : undefined;
    return (
      <span
        key={event.id + segment}
        className={`cal-chip ${small ? 'cal-chip-sm' : ''} cal-chip-${segment}`}
        style={{ '--chip-color': color } as React.CSSProperties}
        title={event.time ? `${event.time} — ${event.title}` : event.title}
      >
        {catColor && <span className="cal-chip-cat-dot" style={{ background: catColor }} />}
        {event.kind === 'task' && <span className="cal-chip-check">{event.done ? '✓' : ''}</span>}
        {event.time && !small && <span className="cal-chip-time">{event.time}</span>}
        <span className="cal-chip-title">{event.title}</span>
        {event.reminder && <span className="cal-reminder-dot" />}
      </span>
    );
  }

  return (
    <section className="panel card cal-panel">
      <div className="cal-filters">
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`cal-filter-chip ${filters.has(p.id) ? 'is-off' : ''}`}
            style={{ '--chip-color': projectColor(projects, p.id) } as React.CSSProperties}
            onClick={() => toggleFilter(p.id)}
          >
            <span className="cal-filter-dot" />
            {p.name}
          </button>
        ))}
        <button
          type="button"
          className={`cal-filter-chip ${filters.has(NONE_FILTER) ? 'is-off' : ''}`}
          onClick={() => toggleFilter(NONE_FILTER)}
        >
          <span className="cal-filter-dot" style={{ background: 'var(--color-muted)' }} />
          No project
        </button>
      </div>

      <div className="cal-head">
        {viewMode === 'month' && (
          <>
            <h3 className="panel-title t-title">{monthLabel}</h3>
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                ‹
              </button>
              <button className="cal-nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
                ›
              </button>
            </div>
          </>
        )}
        {viewMode === 'week' && (
          <>
            <h3 className="panel-title t-title">
              {fromDateKey(weekDays[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
              {fromDateKey(weekDays[6]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </h3>
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={() => shiftWeek(-1)} aria-label="Previous week">
                ‹
              </button>
              <button className="cal-nav-btn" onClick={() => shiftWeek(1)} aria-label="Next week">
                ›
              </button>
            </div>
          </>
        )}
        {viewMode === 'agenda' && <h3 className="panel-title t-title">{monthLabel} — Agenda</h3>}
        <div className="cal-view-toggle">
          {(['month', 'week', 'agenda'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`cal-view-btn ${viewMode === v ? 'is-active' : ''}`}
              onClick={() => setViewMode(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <>
          <div className="cal-grid cal-weekdays">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="cal-weekday t-caption-sm muted">
                {w}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => {
            const firstDay = week.find((d): d is string => !!d);
            const weekNum = period && firstDay ? weekNumberForDate(period, firstDay) : null;
            return (
              <div className="cal-week-row" key={wi}>
                {period && (
                  <div
                    className={`cal-week-label t-caption-sm ${weekNum ? 'has-week' : ''} ${
                      weekNum && isBreakWeek(period, weekNum) ? 'is-break' : ''
                    }`}
                  >
                    {weekNum ? weekLabel(period, weekNum) : ''}
                  </div>
                )}
                <div className="cal-grid">
                  {week.map((key, di) => {
                    if (!key) return <div key={di} className="cal-cell cal-empty" />;
                    const items = monthOccurrenceMap.get(key) ?? [];
                    const visible = items.slice(0, 3);
                    const overflow = items.length - visible.length;
                    return (
                      <button
                        key={di}
                        type="button"
                        className={`cal-cell ${key === todayKey ? 'is-today' : ''} ${key === selected ? 'is-selected' : ''} ${
                          key === rangeAnchor ? 'is-armed' : ''
                        }`}
                        onClick={() => handleCellClick(key)}
                      >
                        <span className="cal-cell-num">{fromDateKey(key).getDate()}</span>
                        <span className="cal-cell-chips">
                          {visible.map((occ) => renderChip(occ, true))}
                          {overflow > 0 && <span className="cal-chip-more t-caption-sm muted">+{overflow} more</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {rangeAnchor && <div className="t-caption-sm accent cal-range-hint">Pick an end date…</div>}
        </>
      )}

      {viewMode === 'week' && (
        <div className="cal-week-grid">
          {weekDays.map((day) => {
            const items = weekOccurrenceMap.get(day) ?? [];
            return (
              <div
                key={day}
                className={`cal-week-day ${day === todayKey ? 'is-today' : ''} ${day === selected ? 'is-selected' : ''}`}
                onClick={() => openDay(day)}
              >
                <div className="cal-week-day-num t-caption-sm muted">{fromDateKey(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</div>
                <div className="cal-week-day-items">{items.map((occ) => renderChip(occ, false))}</div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'agenda' && (
        <div className="cal-agenda">
          {agendaGroups.length === 0 && <div className="muted t-body-sm">No events this month.</div>}
          {agendaGroups.map((g) => (
            <div key={g.date} className="cal-agenda-group">
              <div className="cal-agenda-date t-caption-sm muted">{g.date}</div>
              {g.items.map(({ event }) => (
                <div key={event.id} className="cal-agenda-row" onClick={() => openDay(g.date)}>
                  {event.kind === 'task' ? (
                    <label className="todo-check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={!!event.done} onChange={() => toggleCalendarEvent(event.id)} />
                      <span>{event.title}</span>
                    </label>
                  ) : (
                    <span>
                      {event.time && <span className="cal-event-time">{event.time} — </span>}
                      {event.title}
                    </span>
                  )}
                  <span className="tag">
                    <span className="tag-dot" style={{ background: projectColor(projects, event.projectId) }} />
                    {projectName(event.projectId)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="cal-events">
          <div className="cal-events-head">
            <span className="t-caption-sm muted">
              {selected}
              {formEndDate && formEndDate !== formDate ? ` → ${formEndDate}` : ''}
            </span>
          </div>
          {(monthOccurrenceMap.get(selected) ?? weekOccurrenceMap.get(selected) ?? []).map((occ) => (
            <div key={occ.event.id + occ.segment} className="cal-event">
              {occ.event.kind === 'task' ? (
                <label className="todo-check">
                  <input type="checkbox" checked={!!occ.event.done} onChange={() => toggleCalendarEvent(occ.event.id)} />
                  <span>{occ.event.title}</span>
                </label>
              ) : (
                <span>
                  {occ.event.time && <span className="cal-event-time">{occ.event.time} — </span>}
                  {occ.event.title}
                </span>
              )}
              <div className="cal-event-meta">
                {occ.event.reminder && <span className="cal-reminder-dot" aria-label="Reminder" />}
                <span className="tag">
                  <span className="tag-dot" style={{ background: projectColor(projects, occ.event.projectId) }} />
                  {projectName(occ.event.projectId)}
                </span>
                <button className="todo-del" onClick={() => deleteEvent(occ.event.id)} aria-label="Delete">
                  ×
                </button>
              </div>
            </div>
          ))}

          <div className="cal-add">
            <div className="cal-kind-switch">
              <button type="button" className={kind === 'event' ? 'is-active' : ''} onClick={() => setKind('event')}>
                Event
              </button>
              <button type="button" className={kind === 'task' ? 'is-active' : ''} onClick={() => setKind('task')}>
                Task
              </button>
            </div>
            <input className="input" placeholder="Title…" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="input" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {formProjectId && categoriesForProject(formProjectId).length > 0 && (
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">No category</option>
                {categoriesForProject(formProjectId).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <input
              className="input"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              aria-label={kind === 'task' ? 'Due date' : 'Start date'}
            />
            {kind === 'event' && (
              <input
                className="input"
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                aria-label="End date"
              />
            )}
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
            <label className="cal-reminder-toggle t-caption-sm">
              <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
              Reminder
            </label>
            {kind === 'event' && (
              <label className="cal-reminder-toggle t-caption-sm">
                <input
                  type="checkbox"
                  checked={repeatsWeekly}
                  onChange={(e) => {
                    setRepeatsWeekly(e.target.checked);
                    if (e.target.checked && !until) setUntil(period ? toDateKey(periodEndDate(period)) : '');
                  }}
                />
                Repeats weekly
              </label>
            )}
            {kind === 'event' && repeatsWeekly && (
              <input className="input" type="date" value={until} onChange={(e) => setUntil(e.target.value)} aria-label="Repeat until" />
            )}
            <button className="btn btn-primary btn-pill" onClick={submit}>
              Add
            </button>
          </div>
        </div>
      )}

      <div className="cal-period">
        <button type="button" className="cal-period-toggle t-caption" onClick={() => setPeriodOpen((o) => !o)}>
          Term settings {periodOpen ? '▾' : '▸'}
        </button>
        {periodOpen && (
          <div className="cal-period-body">
            <div className="cal-period-fields">
              <label className="t-caption-sm muted">
                Week 1 starts
                <input
                  className="input"
                  type="date"
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                  onBlur={(e) => e.target.value && setDraftStart(snapToMonday(e.target.value))}
                />
              </label>
              <label className="t-caption-sm muted">
                Weeks
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={52}
                  value={draftWeeks}
                  onChange={(e) => setDraftWeeks(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
            </div>
            <div className="cal-period-weeks">
              {Array.from({ length: draftWeeks }, (_, i) => i + 1).map((wk) => {
                const isBreak = draftBreaks.includes(wk);
                return (
                  <button
                    key={wk}
                    type="button"
                    className={`cal-period-week-pill ${isBreak ? 'is-break' : ''}`}
                    onClick={() => setDraftBreaks((b) => (isBreak ? b.filter((x) => x !== wk) : [...b, wk]))}
                  >
                    {draftLabels[wk] ?? (isBreak ? 'Break' : `Wk ${wk}`)}
                  </button>
                );
              })}
            </div>
            <div className="cal-period-label-row">
              <input
                className="input"
                type="number"
                min={1}
                max={draftWeeks}
                placeholder="Week #"
                value={labelWeekInput}
                onChange={(e) => setLabelWeekInput(e.target.value)}
              />
              <input
                className="input"
                placeholder="Custom label (e.g. Assessment)"
                value={labelTextInput}
                onChange={(e) => setLabelTextInput(e.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={setLabel}>
                Set label
              </button>
            </div>
            <button type="button" className="btn btn-primary btn-pill btn-sm" onClick={savePeriodDraft}>
              Save term
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
