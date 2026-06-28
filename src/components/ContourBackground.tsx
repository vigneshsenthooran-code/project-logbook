// Fixed, full-viewport animated topographic-line backdrop. Sits behind the
// whole app at very low opacity. Pure CSS animation (a slow drift on the SVG
// layer) — paused under prefers-reduced-motion via .contour-bg styles.

const LINES = 11;

export default function ContourBackground() {
  return (
    <div className="contour-bg" aria-hidden>
      <svg
        className="contour-bg-svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {Array.from({ length: LINES }).map((_, i) => {
          // Nested, gently offset contour rings — each a smooth closed-ish blob.
          const o = i * 26;
          return (
            <path
              key={i}
              d={`M${-120 + o},${520 - o * 1.3}
                 C ${260 - o},${300 - o} ${560 + o},${760 + o} ${900},${480 - o}
                 S ${1360 + o},${220 - o} ${1760 - o},${560 + o}`}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.5 + (i % 3) * 0.16}
            />
          );
        })}
      </svg>
    </div>
  );
}
