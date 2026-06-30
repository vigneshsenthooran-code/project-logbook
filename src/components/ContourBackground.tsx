// Fixed, full-viewport topographic backdrop rendered behind the whole app.
// Marching-squares contour lines traced over a slowly-drifting 3D simplex
// noise field (x, y, time) — an elevation map that never quite repeats.
// Cell segments are stitched into connected chains per threshold and drawn
// as smoothed (quadratic) curves so lines read as rounded, not faceted.
import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';

const LINE_COUNT = 7;
const CELL_SIZE = 30;
// Low frequency = large, widely-spaced features — a "zoomed in" elevation
// map rather than dense small wiggles.
const NOISE_FREQ = 0.002;
// One full unit of noise-z drift roughly every 80s — slow enough that the
// lines read as barely shifting rather than visibly animating.
const TIME_FREQ = 1 / 80000;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

const LINE_COLOR = 'rgba(233, 237, 218, 0.04)';
const ACCENT_COLOR = 'rgba(180, 211, 53, 0.03)';
const ACCENT_INDICES = new Set([2, 5]);

type Point = [number, number];

function interp(v0: number, v1: number, threshold: number): number {
  if (v1 === v0) return 0.5;
  return Math.max(0, Math.min(1, (threshold - v0) / (v1 - v0)));
}

/** Stitches independent cell-edge segments into connected polylines/loops. */
function buildChains(segments: [Point, Point][]): Point[][] {
  const keyOf = (p: Point) => `${p[0].toFixed(2)}_${p[1].toFixed(2)}`;
  const nodeIndex = new Map<string, number>();
  const nodes: { x: number; y: number; links: number[] }[] = [];
  const edges: [number, number][] = [];

  function getNode(p: Point): number {
    const k = keyOf(p);
    let idx = nodeIndex.get(k);
    if (idx === undefined) {
      idx = nodes.length;
      nodes.push({ x: p[0], y: p[1], links: [] });
      nodeIndex.set(k, idx);
    }
    return idx;
  }

  for (const [a, b] of segments) {
    const ia = getNode(a);
    const ib = getNode(b);
    if (ia === ib) continue;
    const edgeIdx = edges.length;
    edges.push([ia, ib]);
    nodes[ia].links.push(edgeIdx);
    nodes[ib].links.push(edgeIdx);
  }

  const usedEdges = new Array(edges.length).fill(false);
  const chains: Point[][] = [];

  function otherEnd(edgeIdx: number, nodeIdx: number): number {
    const [a, b] = edges[edgeIdx];
    return a === nodeIdx ? b : a;
  }

  function walk(startNode: number, startEdge: number): Point[] {
    const chain: Point[] = [[nodes[startNode].x, nodes[startNode].y]];
    let currentNode = startNode;
    let currentEdge: number | undefined = startEdge;
    while (currentEdge !== undefined && !usedEdges[currentEdge]) {
      usedEdges[currentEdge] = true;
      const nextNode = otherEnd(currentEdge, currentNode);
      chain.push([nodes[nextNode].x, nodes[nextNode].y]);
      currentNode = nextNode;
      currentEdge = nodes[currentNode].links.find((e) => !usedEdges[e]);
    }
    return chain;
  }

  // Open chains first — start from dangling ends (lines exiting the canvas).
  for (let i = 0; i < nodes.length; i++) {
    const openEdge = nodes[i].links.length === 1 ? nodes[i].links[0] : undefined;
    if (openEdge !== undefined && !usedEdges[openEdge]) {
      chains.push(walk(i, openEdge));
    }
  }
  // Whatever's left forms closed loops.
  for (let e = 0; e < edges.length; e++) {
    if (!usedEdges[e]) {
      chains.push(walk(edges[e][0], e));
    }
  }

  return chains;
}

/** Draws a chain as a smoothed curve through quadratic midpoints. */
function strokeChain(ctx: CanvasRenderingContext2D, chain: Point[]) {
  if (chain.length < 2) return;
  ctx.moveTo(chain[0][0], chain[0][1]);
  if (chain.length === 2) {
    ctx.lineTo(chain[1][0], chain[1][1]);
    return;
  }
  for (let i = 1; i < chain.length - 1; i++) {
    const xc = (chain[i][0] + chain[i + 1][0]) / 2;
    const yc = (chain[i][1] + chain[i + 1][1]) / 2;
    ctx.quadraticCurveTo(chain[i][0], chain[i][1], xc, yc);
  }
  const last = chain[chain.length - 1];
  const prev = chain[chain.length - 2];
  ctx.quadraticCurveTo(prev[0], prev[1], last[0], last[1]);
}

export default function ContourBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noise3D = createNoise3D();

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.ceil(width * dpr);
      canvas!.height = Math.ceil(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.lineJoin = 'round';
      ctx!.lineCap = 'round';
      cols = Math.ceil(width / CELL_SIZE) + 1;
      rows = Math.ceil(height / CELL_SIZE) + 1;
    }

    const thresholds = Array.from({ length: LINE_COUNT }, (_, i) => {
      const t = (i + 1) / (LINE_COUNT + 1);
      return (t - 0.5) * 1.9;
    });

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);

      const grid: number[][] = [];
      for (let j = 0; j <= rows; j++) {
        const row: number[] = [];
        for (let i = 0; i <= cols; i++) {
          row.push(noise3D(i * CELL_SIZE * NOISE_FREQ, j * CELL_SIZE * NOISE_FREQ, time * TIME_FREQ));
        }
        grid.push(row);
      }

      thresholds.forEach((threshold, idx) => {
        const segments: [Point, Point][] = [];

        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const tl = grid[j][i];
            const tr = grid[j][i + 1];
            const br = grid[j + 1][i + 1];
            const bl = grid[j + 1][i];

            let state = 0;
            if (tl >= threshold) state |= 8;
            if (tr >= threshold) state |= 4;
            if (br >= threshold) state |= 2;
            if (bl >= threshold) state |= 1;
            if (state === 0 || state === 15) continue;

            const x0 = i * CELL_SIZE;
            const y0 = j * CELL_SIZE;

            const N: Point = [x0 + interp(tl, tr, threshold) * CELL_SIZE, y0];
            const E: Point = [x0 + CELL_SIZE, y0 + interp(tr, br, threshold) * CELL_SIZE];
            const S: Point = [x0 + interp(bl, br, threshold) * CELL_SIZE, y0 + CELL_SIZE];
            const W: Point = [x0, y0 + interp(tl, bl, threshold) * CELL_SIZE];

            switch (state) {
              case 1: segments.push([W, S]); break;
              case 2: segments.push([S, E]); break;
              case 3: segments.push([W, E]); break;
              case 4: segments.push([N, E]); break;
              case 5: segments.push([N, W], [S, E]); break;
              case 6: segments.push([N, S]); break;
              case 7: segments.push([N, W]); break;
              case 8: segments.push([N, W]); break;
              case 9: segments.push([N, S]); break;
              case 10: segments.push([N, E], [S, W]); break;
              case 11: segments.push([N, E]); break;
              case 12: segments.push([W, E]); break;
              case 13: segments.push([S, E]); break;
              case 14: segments.push([W, S]); break;
            }
          }
        }

        const chains = buildChains(segments);
        ctx!.beginPath();
        ctx!.strokeStyle = ACCENT_INDICES.has(idx) ? ACCENT_COLOR : LINE_COLOR;
        ctx!.lineWidth = 1;
        for (const chain of chains) strokeChain(ctx!, chain);
        ctx!.stroke();
      });
    }

    resize();

    if (reduceMotion) {
      draw(0);
      const handleResize = () => {
        resize();
        draw(0);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    let raf = 0;
    let lastFrame = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - lastFrame < FRAME_INTERVAL) return;
      lastFrame = t;
      draw(t);
    };
    raf = requestAnimationFrame(tick);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="contour-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="contour-bg-canvas" />
    </div>
  );
}
