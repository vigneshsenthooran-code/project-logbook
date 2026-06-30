// Interactive radial line-map, the dashboard's hero element. A fixed centre
// node (the project) branches into one straight main line per category with
// entries, each ending in a small square; thinner secondary lines fan out
// near each branch's end, one per entry, ending in a small circle. Every
// branch tip drifts continuously in place and leans subtly toward the
// cursor — but never crosses a neighbouring main branch's sector.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { topCategories } from '../lib/categories';
import type { Category, Entry } from '../types';
import EntryDetailModal from './EntryDetailModal';
import EntryEditModal from './EntryEditModal';

const VB_W = 1000;
const VB_H = 600;
const CENTER = { x: VB_W / 2, y: VB_H / 2 };
const MAIN_RADIUS_MAX = 270;
const MAIN_RADIUS_MIN_FACTOR = 0.64;
const ENTRY_MIN_FACTOR = 0.6;
const ENTRY_MAX_FACTOR = 1.05;
const MAX_ENTRY_NODES_PER_BUCKET = 18;
const LINE_COLOR = 'var(--color-border-strong)';

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}
/** Deterministic 0..1 pseudo-random from a seed, stable across re-renders. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

interface Bucket {
  id: string;
  name: string;
  color: string;
  entries: Entry[];
}

interface MainNode {
  id: string;
  angle: number;
  radius: number;
  baseX: number;
  baseY: number;
  phase: number;
  freq: number;
  amp: number;
  name: string;
  color: string;
  count: number;
}

interface EntryNode {
  id: string;
  bucketId: string;
  angle: number;
  radius: number;
  baseX: number;
  baseY: number;
  phase: number;
  freq: number;
  amp: number;
  color: string;
  entry: Entry;
}

function buildBuckets(entries: Entry[], categories: Category[]): Bucket[] {
  const tops = topCategories(categories);
  const parentOf = new Map<string, string>();
  for (const c of categories) {
    if (c.parentId) parentOf.set(c.id, c.parentId);
  }
  const byTop = new Map<string, Entry[]>();
  for (const e of entries) {
    const topId = parentOf.get(e.categoryId) ?? e.categoryId;
    const arr = byTop.get(topId);
    if (arr) arr.push(e);
    else byTop.set(topId, [e]);
  }
  const buckets: Bucket[] = [];
  for (const cat of tops) {
    const list = byTop.get(cat.id);
    if (list && list.length > 0) {
      buckets.push({ id: cat.id, name: cat.name, color: cat.color, entries: list });
      byTop.delete(cat.id);
    }
  }
  // Anything left over (e.g. inbox / orphaned categoryId) gets its own bucket
  // so entries never silently disappear from the map.
  for (const [id, list] of byTop) {
    if (list.length > 0) {
      buckets.push({ id, name: 'Inbox', color: 'var(--color-muted)', entries: list });
    }
  }
  return buckets;
}

export default function ProjectMap() {
  const navigate = useNavigate();
  const activeProjectId = useStore((s) => s.activeProjectId);
  const entries = useStore((s) => s.entries).filter((e) => e.projectId === activeProjectId);
  const categories = useStore((s) => s.config.categories);

  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const buckets = useMemo(() => buildBuckets(entries, categories), [entries, categories]);

  const mainNodes = useMemo<MainNode[]>(() => {
    const n = buckets.length;
    if (n === 0) return [];
    const angleStep = (Math.PI * 2) / n;
    const start = -Math.PI / 2 - (n > 1 ? angleStep / 2 : 0);
    return buckets.map((b, i) => {
      const seed = hash(b.id);
      // Jitter the angle within its sector (keeps branches from crossing)
      // and randomize the reach so branches don't all land on one ring.
      const angle = start + i * angleStep + (rand(seed + 5) * 2 - 1) * angleStep * 0.12;
      const radius = MAIN_RADIUS_MAX * (MAIN_RADIUS_MIN_FACTOR + rand(seed + 6) * (1 - MAIN_RADIUS_MIN_FACTOR));
      return {
        id: b.id,
        angle,
        radius,
        baseX: CENTER.x + Math.cos(angle) * radius,
        baseY: CENTER.y + Math.sin(angle) * radius,
        phase: rand(seed) * Math.PI * 2,
        freq: 0.18 + rand(seed + 1) * 0.1,
        amp: 4 + rand(seed + 2) * 3,
        name: b.name,
        color: b.color,
        count: b.entries.length,
      };
    });
  }, [buckets]);

  const entryNodes = useMemo<EntryNode[]>(() => {
    const n = buckets.length;
    if (n === 0) return [];
    const angleStep = (Math.PI * 2) / n;
    const spread = Math.min(angleStep * 0.42, 0.5);
    const out: EntryNode[] = [];
    buckets.forEach((b, i) => {
      const main = mainNodes[i];
      if (!main) return;
      const shown = b.entries.slice(0, MAX_ENTRY_NODES_PER_BUCKET);
      shown.forEach((entry) => {
        const seed = hash(entry.id);
        const angle = main.angle + (rand(seed) * 2 - 1) * spread;
        const radius = main.radius * (ENTRY_MIN_FACTOR + rand(seed + 1) * (ENTRY_MAX_FACTOR - ENTRY_MIN_FACTOR));
        out.push({
          id: entry.id,
          bucketId: b.id,
          angle,
          radius,
          baseX: CENTER.x + Math.cos(angle) * radius,
          baseY: CENTER.y + Math.sin(angle) * radius,
          phase: rand(seed + 2) * Math.PI * 2,
          freq: 0.3 + rand(seed + 3) * 0.22,
          amp: 8 + rand(seed + 4) * 7,
          color: b.color,
          entry,
        });
      });
    });
    return out;
  }, [buckets, mainNodes]);

  const svgRef = useRef<SVGSVGElement>(null);
  const mainLineRefs = useRef(new Map<string, SVGLineElement>());
  const mainGroupRefs = useRef(new Map<string, SVGGElement>());
  const entryLineRefs = useRef(new Map<string, SVGLineElement>());
  const entryGroupRefs = useRef(new Map<string, SVGGElement>());

  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseSmoothed = useRef({ x: 0, y: 0 });

  const [hover, setHover] = useState<{ x: number; y: number; label: string; sub: string } | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handlePointerMove = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseTarget.current = { x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) };
    };
    const handlePointerLeave = () => {
      mouseTarget.current = { x: 0, y: 0 };
    };

    const svg = svgRef.current;
    svg?.addEventListener('pointermove', handlePointerMove);
    svg?.addEventListener('pointerleave', handlePointerLeave);

    if (reduce) {
      return () => {
        svg?.removeEventListener('pointermove', handlePointerMove);
        svg?.removeEventListener('pointerleave', handlePointerLeave);
      };
    }

    let raf = 0;
    const MAIN_MOUSE_INFLUENCE = 7;
    const ENTRY_MOUSE_INFLUENCE = 20;

    const tick = (t: number) => {
      const time = t / 1000;
      mouseSmoothed.current.x += (mouseTarget.current.x - mouseSmoothed.current.x) * 0.04;
      mouseSmoothed.current.y += (mouseTarget.current.y - mouseSmoothed.current.y) * 0.04;
      const mx = mouseSmoothed.current.x;
      const my = mouseSmoothed.current.y;

      for (const node of mainNodes) {
        const dx = Math.sin(time * node.freq + node.phase) * node.amp + mx * MAIN_MOUSE_INFLUENCE;
        const dy = Math.cos(time * node.freq * 1.3 + node.phase) * node.amp + my * MAIN_MOUSE_INFLUENCE;
        const x = node.baseX + dx;
        const y = node.baseY + dy;
        const line = mainLineRefs.current.get(node.id);
        const group = mainGroupRefs.current.get(node.id);
        if (line) {
          line.setAttribute('x2', String(x));
          line.setAttribute('y2', String(y));
        }
        // CSS transform (vs. the SVG transform attribute) lets the browser
        // composite this on its own layer with subpixel interpolation —
        // attribute mutation forces a layout pass each frame, which is what
        // made the small label text visibly judder as it moved.
        if (group) group.style.transform = `translate(${x}px,${y}px)`;
      }

      for (const node of entryNodes) {
        const dx = Math.sin(time * node.freq + node.phase) * node.amp + mx * ENTRY_MOUSE_INFLUENCE;
        const dy = Math.cos(time * node.freq * 1.25 + node.phase) * node.amp + my * ENTRY_MOUSE_INFLUENCE;
        const x = node.baseX + dx;
        const y = node.baseY + dy;
        const line = entryLineRefs.current.get(node.id);
        const group = entryGroupRefs.current.get(node.id);
        if (line) {
          line.setAttribute('x2', String(x));
          line.setAttribute('y2', String(y));
        }
        if (group) group.style.transform = `translate(${x}px,${y}px)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      svg?.removeEventListener('pointermove', handlePointerMove);
      svg?.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [mainNodes, entryNodes]);

  const entrySummary = (entry: Entry): string => {
    if (entry.type === 'link' && entry.link) return entry.link.title || entry.link.domain;
    if (entry.body) return entry.body.length > 60 ? entry.body.slice(0, 60) + '…' : entry.body;
    return entry.type[0].toUpperCase() + entry.type.slice(1);
  };

  return (
    <div className="project-map" aria-hidden={entries.length === 0}>
      <svg
        ref={svgRef}
        className="project-map-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {entryNodes.map((node) => (
          <line
            key={`el-${node.id}`}
            ref={(el) => {
              if (el) entryLineRefs.current.set(node.id, el);
              else entryLineRefs.current.delete(node.id);
            }}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={node.baseX}
            y2={node.baseY}
            stroke={LINE_COLOR}
            strokeWidth={0.75}
            strokeOpacity={0.22}
          />
        ))}

        {mainNodes.map((node) => (
          <line
            key={`ml-${node.id}`}
            ref={(el) => {
              if (el) mainLineRefs.current.set(node.id, el);
              else mainLineRefs.current.delete(node.id);
            }}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={node.baseX}
            y2={node.baseY}
            stroke={LINE_COLOR}
            strokeWidth={1.2}
            strokeOpacity={0.4}
          />
        ))}

        {entryNodes.map((node) => (
          <g
            key={`eg-${node.id}`}
            ref={(el) => {
              if (el) entryGroupRefs.current.set(node.id, el);
              else entryGroupRefs.current.delete(node.id);
            }}
            transform={`translate(${node.baseX},${node.baseY})`}
            className="project-map-entry"
            onPointerEnter={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (!rect) return;
              setHover({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                label: entrySummary(node.entry),
                sub: node.entry.type,
              });
            }}
            onPointerLeave={() => setHover(null)}
            onClick={() => setViewingEntry(node.entry)}
          >
            <circle r={6} fill="transparent" style={{ pointerEvents: 'all' }} />
            <circle r={3} fill={node.color} fillOpacity={0.85} stroke="var(--color-card)" strokeWidth={0.6} />
          </g>
        ))}

        {mainNodes.map((node) => (
          <g
            key={`mg-${node.id}`}
            ref={(el) => {
              if (el) mainGroupRefs.current.set(node.id, el);
              else mainGroupRefs.current.delete(node.id);
            }}
            transform={`translate(${node.baseX},${node.baseY})`}
            className="project-map-branch"
            onClick={() => navigate(`/projects/${activeProjectId}?cat=${node.id}`)}
          >
            <rect x={-9} y={-9} width={18} height={18} fill="transparent" style={{ pointerEvents: 'all' }} />
            <rect x={-4.5} y={-4.5} width={9} height={9} fill={node.color} stroke="var(--color-card)" strokeWidth={1} />
            <text className="project-map-branch-label" x={9} y={3.5} textAnchor="start">
              {node.name}
            </text>
            <text className="project-map-branch-count" x={9} y={16} textAnchor="start">
              {node.count}
            </text>
          </g>
        ))}

        <g transform={`translate(${CENTER.x},${CENTER.y})`}>
          <rect x={-6} y={-6} width={12} height={12} fill="var(--color-primary)" />
        </g>
      </svg>

      {hover && (
        <div className="project-map-tooltip" style={{ left: hover.x, top: hover.y }}>
          <span className="t-caption-sm project-map-tooltip-type">{hover.sub}</span>
          <span className="project-map-tooltip-label">{hover.label}</span>
        </div>
      )}

      {buckets.length === 0 && (
        <p className="project-map-empty t-caption-sm">Capture your first entry to start the map.</p>
      )}

      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          categories={categories}
          onClose={() => setViewingEntry(null)}
          onEdit={(e) => {
            setViewingEntry(null);
            setEditingEntry(e);
          }}
        />
      )}
      {editingEntry && (
        <EntryEditModal entry={editingEntry} categories={categories} onClose={() => setEditingEntry(null)} />
      )}
    </div>
  );
}
