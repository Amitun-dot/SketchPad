import { createId } from './defaults';
import type { Point, Stroke } from './types';

const MIN_RUN_POINTS = 2;

function splitOutside(points: Point[], x: number, y: number, radiusSq: number): Point[][] {
  const runs: Point[][] = [];
  let run: Point[] = [];
  for (const point of points) {
    const dx = point[0] - x;
    const dy = point[1] - y;
    if (dx * dx + dy * dy > radiusSq) {
      run.push(point);
    } else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) runs.push(run);
  return runs;
}

/** Removes the part of every stroke inside the circle; returns the same array when nothing changed. */
export function eraseAtPoint(strokes: Stroke[], x: number, y: number, radius: number): Stroke[] {
  const radiusSq = radius * radius;
  let changed = false;
  const next: Stroke[] = [];

  for (const stroke of strokes) {
    const touched = stroke.points.some(([px, py]) => {
      const dx = px - x;
      const dy = py - y;
      return dx * dx + dy * dy <= radiusSq;
    });
    if (!touched) {
      next.push(stroke);
      continue;
    }
    changed = true;
    for (const run of splitOutside(stroke.points, x, y, radiusSq)) {
      if (run.length >= MIN_RUN_POINTS) next.push({ ...stroke, id: createId(), points: run });
    }
  }

  return changed ? next : strokes;
}

/** Erases along a straight segment so fast eraser movement leaves no gaps. */
export function eraseAlongSegment(
  strokes: Stroke[],
  from: [number, number],
  to: [number, number],
  radius: number
): Stroke[] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const distance = Math.hypot(dx, dy);
  const step = Math.max(radius * 0.5, 0.5);
  const count = Math.max(1, Math.ceil(distance / step));

  let result = strokes;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    result = eraseAtPoint(result, from[0] + dx * t, from[1] + dy * t, radius);
  }
  return result;
}
