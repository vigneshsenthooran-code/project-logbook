import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import type { CalendarEvent } from '../types';
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
const BAR_ROW_H = 20; // px per multi-day bar lane, incl. gap
const BAR_GRID_TOP = '26px'; // aligns bars just below the day number

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

type Bar = { event: CalendarEvent; startCol: number; endCol: number; lane: number };

/** Lays out multi-day (non-recurring) events spanning this week's 7 date keys into non-overlapping lanes. */
function computeWeekBars(weekKeys: string[], events: CalendarEvent[]): Bar[] {
  const weekStart = weekKeys[0];
  const weekEnd = weekKeys[6];
  const spans: { event: CalendarEvent; startCol: number; endCol: number }[] = [];
  for (const e of events) {
    if (e.recurrence?.freq === 'weekly') continue;
    const end = e.endDate ?? e.date;
    if (end === e.date) continue; // single-day, rendered as a normal chip
    if (end < weekStart || e.date > weekEnd) continue;
    const clippedStart = e.date > weekStart ? e.date : weekStart;
    const clippedEnd = end < weekEnd ? end : weekEnd;
    const startCol = weekKeys.indexOf(clippedStart);
    const endCol = weekKeys.indexOf(clippedEnd);
    if (startCol === -1 || endCol === -1) continue;
    spans.push({ event: e, startCol, endCol });
  }
  spans.sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);
  const laneEnds: number[] = [];
  const bars: Bar[] = [];
  for (const s of spans) {
    let lane = laneEnds.findIndex((endCol) => endCol < s.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(s.endCol);
    } else {
      laneEnds[lane] = s.endCol;
    }
    bars.push({ ...s, lane });
  }
  return bars;
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
  const resetPeriod = useStore((s) => s.resetPeriod);

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [view, setView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [weekStartDate, setWeekStartDate] = useState(() => snapToMonday(toDateKey(new Date())));
  const [selected, setSelected] = useState<string | null>(null);
  const [displayedDay, setDisplayedDay] = useState<string | null>(null);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDocPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelected(null);
        setRangeAnchor(null);
      }
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocPointerDown);
    return () => document.removeEventListener('mousedown', handleDocPointerDown);
  }, []);

  // Keeps the last-open day's content mounted while the panel collapses, so the
  // accordion shrink animates smoothly instead of the content vanishing instantly.
  useEffect(() => {
    if (selected) setDisplayedDay(selected);
  }, [selected]);

  // Add-item form
  const [kind, setKind] = useState<CalendarEvent['kind']>('event');
  const [title, setTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [time, setTime] = useState('');
  const [reminder, setReminder] = useState(false);
  const [formProjectId, setFormProjectId] = useState('');
  const [repeatsWeekly, setRepeatsWeekly] = useState(false);
  const [until, setUntil] = useState('');

  // Term/period builder
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodInitRef = useRef(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftWeeks, setDraftWeeks] = useState(12);
  const [draftBreaks, setDraftBreaks] = useState<number[]>([]);
  const [draftCountBreaks, setDraftCountBreaks] = useState(true);
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
      setDraftCountBreaks(period.countBreaks !== false);
      setDraftLabels(period.labels ?? {});
    } else {
      setDraftStart('');
      setDraftWeeks(12);
      setDraftBreaks([]);
      setDraftCountBreaks(true);
      setDraftLabels({});
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

  // ---- Month grid ----
  const first = new Date(view.year, view.month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  type MonthCell = { key: string; outside: boolean };
  const cells: MonthCell[] = [];
  for (let i = startOffset; i > 0; i--) cells.push({ key: toDateKey(new Date(view.year, view.month, 1 - i)), outside: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: toDateKey(new Date(view.year, view.month, d)), outside: false });
  for (let d = 1; cells.length % 7 !== 0; d++) cells.push({ key: toDateKey(new Date(view.year, view.month + 1, d)), outside: true });
  const weeks: MonthCell[][] = [];
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
  const weekViewNum = period ? weekNumberForDate(period, weekDays[0]) : null;
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
      recurrence,
    });
    setTitle('');
    setTime('');
    setReminder(false);
    setRepeatsWeekly(false);
    setUntil('');
  }

  function savePeriodDraft() {
    if (!draftStart || draftWeeks < 1) return;
    void savePeriod({
      startDate: snapToMonday(draftStart),
      weekCount: draftWeeks,
      breakWeeks: draftBreaks,
      countBreaks: draftCountBreaks,
      labels: Object.keys(draftLabels).length ? draftLabels : undefined,
    });
    setPeriodOpen(false);
  }

  function resetTerm() {
    if (!period) return;
    if (!confirm('Clear the term? The calendar goes back to needing a new term set up. This cannot be undone.')) return;
    void resetPeriod();
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

  function editLabel(week: number, text: string) {
    setLabelWeekInput(String(week));
    setLabelTextInput(text);
  }

  function removeLabel(week: number) {
    setDraftLabels((l) => {
      const next = { ...l };
      delete next[week];
      return next;
    });
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
    <section className="panel card cal-panel" ref={panelRef}>
      <div className="cal-filters-bar" ref={filtersRef}>
        <button type="button" className="cal-filters-toggle t-caption-sm" onClick={() => setFiltersOpen((o) => !o)}>
          Filter projects
          {filters.size > 0 && <span className="cal-filters-badge">{filters.size} hidden</span>}
          <span className="cal-filters-caret">{filtersOpen ? '▾' : '▸'}</span>
        </button>
        <div className={`cal-filters-panel ${filtersOpen ? 'is-open' : ''}`} aria-hidden={!filtersOpen}>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              tabIndex={filtersOpen ? 0 : -1}
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
            tabIndex={filtersOpen ? 0 : -1}
            className={`cal-filter-chip ${filters.has(NONE_FILTER) ? 'is-off' : ''}`}
            onClick={() => toggleFilter(NONE_FILTER)}
          >
            <span className="cal-filter-dot" style={{ background: 'var(--color-muted)' }} />
            No project
          </button>
        </div>
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
              {weekViewNum && (
                <span className={`cal-week-view-badge t-caption-sm ${isBreakWeek(period!, weekViewNum) ? 'is-break' : ''}`}>
                  {weekLabel(period!, weekViewNum)}
                </span>
              )}
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
            const firstDay = week[0]?.key;
            const weekNum = period && firstDay ? weekNumberForDate(period, firstDay) : null;
            const weekKeys = week.map((c) => c.key);
            const bars = computeWeekBars(weekKeys, activeEvents);
            const laneCount = bars.reduce((m, b) => Math.max(m, b.lane + 1), 0);
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
                <div className="cal-week-grid-wrap">
                  <div className="cal-grid">
                    {week.map(({ key, outside }, di) => {
                      if (outside) {
                        return (
                          <div key={di} className="cal-cell cal-outside">
                            <span className="cal-cell-num">{fromDateKey(key).getDate()}</span>
                          </div>
                        );
                      }
                      const items = (monthOccurrenceMap.get(key) ?? []).filter((occ) => occ.segment === 'single');
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
                          <span className="cal-cell-chips" style={laneCount ? { marginTop: laneCount * BAR_ROW_H } : undefined}>
                            {visible.map((occ) => renderChip(occ, true))}
                            {overflow > 0 && <span className="cal-chip-more t-caption-sm muted">+{overflow} more</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {bars.length > 0 && (
                    <div className="cal-grid cal-bar-grid" style={{ top: BAR_GRID_TOP, gridTemplateRows: `repeat(${laneCount}, ${BAR_ROW_H}px)` }}>
                      {bars.map((b) => (
                        <span
                          key={b.event.id}
                          className="cal-chip cal-chip-bar"
                          style={
                            {
                              '--chip-color': projectColor(projects, b.event.projectId),
                              gridColumn: `${b.startCol + 1} / ${b.endCol + 2}`,
                              gridRow: b.lane + 1,
                            } as React.CSSProperties
                          }
                          title={b.event.title}
                          onClick={() => openDay(b.event.date)}
                        >
                          {b.event.kind === 'task' && <span className="cal-chip-check">{b.event.done ? '✓' : ''}</span>}
                          <span className="cal-chip-title">{b.event.title}</span>
                          {b.event.reminder && <span className="cal-reminder-dot" />}
                        </span>
                      ))}
                    </div>
                  )}
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

      <div className={`cal-collapse ${selected ? 'is-open' : ''}`}>
        <div className="cal-collapse-inner">
          {displayedDay && (
        <div className="cal-events">
          <div className="cal-events-head">
            <span className="t-caption-sm muted">
              {displayedDay}
              {formEndDate && formEndDate !== formDate ? ` → ${formEndDate}` : ''}
            </span>
          </div>
          {(monthOccurrenceMap.get(displayedDay) ?? weekOccurrenceMap.get(displayedDay) ?? []).map((occ) => (
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
        </div>
      </div>

      <div className="cal-period">
        <button type="button" className="cal-period-toggle t-caption" onClick={() => setPeriodOpen((o) => !o)}>
          Term settings {periodOpen ? '▾' : '▸'}
        </button>
        <div className={`cal-collapse ${periodOpen ? 'is-open' : ''}`}>
          <div className="cal-collapse-inner">
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
              <label className="cal-period-checkbox t-caption-sm muted">
                <input
                  type="checkbox"
                  checked={draftCountBreaks}
                  onChange={(e) => setDraftCountBreaks(e.target.checked)}
                />
                Count breaks
              </label>
            </div>
            <div className="cal-period-weeks">
              {Array.from({ length: draftWeeks }, (_, i) => i + 1).map((wk) => {
                const isBreak = draftBreaks.includes(wk);
                const label = weekLabel(
                  { breakWeeks: draftBreaks, labels: draftLabels, countBreaks: draftCountBreaks },
                  wk
                );
                return (
                  <button
                    key={wk}
                    type="button"
                    className={`cal-period-week-pill ${isBreak ? 'is-break' : ''}`}
                    onClick={() => setDraftBreaks((b) => (isBreak ? b.filter((x) => x !== wk) : [...b, wk]))}
                  >
                    {label}
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
            {Object.keys(draftLabels).length > 0 && (
              <div className="cal-period-labels">
                {Object.entries(draftLabels)
                  .map(([wk, text]) => [Number(wk), text] as [number, string])
                  .sort((a, b) => a[0] - b[0])
                  .map(([wk, text]) => (
                    <div key={wk} className="cal-period-label-chip">
                      <button type="button" className="cal-period-label-edit" onClick={() => editLabel(wk, text)}>
                        <strong>Wk {wk}</strong> {text}
                      </button>
                      <button
                        type="button"
                        className="cal-period-label-remove"
                        onClick={() => removeLabel(wk)}
                        aria-label={`Remove label for week ${wk}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
            <div className="cal-period-actions">
              <button type="button" className="btn btn-primary btn-pill btn-sm" onClick={savePeriodDraft}>
                Save term
              </button>
              {period && (
                <button type="button" className="btn btn-danger btn-sm" onClick={resetTerm}>
                  Clear term
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
