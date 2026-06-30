import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/* Column-major masonry: items fill the first column top-to-bottom, then the
   second, etc. — each column flows independently so a short card doesn't
   leave a dead gap before the next item, unlike a CSS grid row. */
export default function Masonry({
  items,
  minColumnWidth,
  gap,
  className,
}: {
  items: { key: string; node: ReactNode }[];
  minColumnWidth: number;
  gap: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const recompute = (width: number) => {
      const next = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
      setColumnCount((prev) => (prev === next ? prev : next));
    };

    const ro = new ResizeObserver((entries) => recompute(entries[0].contentRect.width));
    ro.observe(el);

    // Belt-and-suspenders: a window resize (e.g. a devtools/sidebar panel
    // closing) should already retrigger the observer, but re-measure
    // directly here too in case that edge update gets missed, so the
    // column count can never get stuck below what the available width fits.
    const handleWindowResize = () => recompute(el.getBoundingClientRect().width);
    window.addEventListener('resize', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [gap, minColumnWidth]);

  const columns = useMemo(() => {
    const perColumn = Math.ceil(items.length / columnCount);
    return Array.from({ length: columnCount }, (_, i) => items.slice(i * perColumn, (i + 1) * perColumn));
  }, [items, columnCount]);

  return (
    <div ref={containerRef} className={className} style={{ display: 'flex', gap, alignItems: 'flex-start' }}>
      {columns.map((col, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap, flex: 1, minWidth: 0 }}>
          {col.map((item) => (
            <div key={item.key}>{item.node}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
