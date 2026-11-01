import { getStroke } from 'perfect-freehand';
import type { Point, Stroke, StrokeSettings } from './types';

const pathCache = new WeakMap<Stroke, Path2D>();

function average(a: number, b: number): number {
  return (a + b) / 2;
}

function getSvgPathFromStroke(outline: number[][]): string {
  const length = outline.length;
  if (length < 4) return '';
  let [ax, ay] = outline[0];
  const [bx, by] = outline[1];
  const [cx, cy] = outline[2];
  let path = `M${ax.toFixed(3)},${ay.toFixed(3)} Q${bx.toFixed(3)},${by.toFixed(3)} ${average(bx, cx).toFixed(3)},${average(by, cy).toFixed(3)} T`;
  for (let i = 2; i < length - 1; i++) {
    [ax, ay] = outline[i];
    const [nx, ny] = outline[i + 1];
    path += `${average(ax, nx).toFixed(3)},${average(ay, ny).toFixed(3)} `;
  }
  return `${path}Z`;
}

export function buildStrokePath(settings: StrokeSettings, points: Point[], complete: boolean): Path2D {
  const outline = getStroke(points, {
    size: settings.size,
    thinning: settings.thinning,
    smoothing: settings.smoothing,
    streamline: settings.streamline,
    simulatePressure: settings.simulatePressure,
    last: complete,
  });
  return new Path2D(getSvgPathFromStroke(outline));
}

function cachedStrokePath(stroke: Stroke): Path2D {
  let path = pathCache.get(stroke);
  if (!path) {
    path = buildStrokePath(stroke, stroke.points, true);
    pathCache.set(stroke, path);
  }
  return path;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  ctx.globalAlpha = stroke.opacity;
  ctx.fillStyle = stroke.color;
  ctx.fill(cachedStrokePath(stroke));
  ctx.globalAlpha = 1;
}

/** Highlighter ink is painted first so it never covers handwriting. */
export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  for (const stroke of strokes) {
    if (stroke.tool === 'highlighter') drawStroke(ctx, stroke);
  }
  for (const stroke of strokes) {
    if (stroke.tool !== 'highlighter') drawStroke(ctx, stroke);
  }
}
