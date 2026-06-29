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
    const ro = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const next = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
      setColumnCount((prev) => (prev === next ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
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
