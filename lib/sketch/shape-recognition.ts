
import type { Point } from './types';

export type RecognizedShapeType =
  | 'circle'
  | 'rectangle'
  | 'triangle'
  | 'line'
  | 'arrow';

export interface RecognizedShape {
  type: RecognizedShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_DIAGONAL = 12;
const CLOSED_THRESHOLD = 0.18;
const STRAIGHTNESS_THRESHOLD = 0.96;

function distance(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function getBounds(points: Point[]) {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function pathLength(points: Point[]): number {
  let length = 0;

  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }

  return length;
}

function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  const first = points[0];
  const last = points[points.length - 1];

  let maxDistance = 0;
  let index = 0;

  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const denominator = Math.hypot(dx, dy) || 1;

  for (let i = 1; i < points.length - 1; i++) {
    const currentDistance =
      Math.abs(
        dy * points[i][0] -
          dx * points[i][1] +
          last[0] * first[1] -
          last[1] * first[0]
      ) / denominator;

    if (currentDistance > maxDistance) {
      maxDistance = currentDistance;
      index = i;
    }
  }

  if (maxDistance <= tolerance) {
    return [first, last];
  }

  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);

  return [...left.slice(0, -1), ...right];
}

// Simplifies a closed path without treating its first and last
// points as a straight line.
function simplifyClosed(
  points: Point[],
  tolerance: number
): Point[] {
  if (points.length <= 3) return points;

  const openPoints = [...points];

  if (distance(openPoints[0], openPoints[openPoints.length - 1]) < 0.001) {
    openPoints.pop();
  }

  if (openPoints.length <= 3) return openPoints;

  const first = openPoints[0];

  let farthestIndex = 1;
  let farthestDistance = 0;

  for (let i = 1; i < openPoints.length; i++) {
    const currentDistance = distance(first, openPoints[i]);

    if (currentDistance > farthestDistance) {
      farthestDistance = currentDistance;
      farthestIndex = i;
    }
  }

  const firstArc = openPoints.slice(0, farthestIndex + 1);
  const secondArc = [
    ...openPoints.slice(farthestIndex),
    first,
  ];

  const simplifiedFirst = simplify(firstArc, tolerance);
  const simplifiedSecond = simplify(secondArc, tolerance);

  return [
    ...simplifiedFirst.slice(0, -1),
    ...simplifiedSecond.slice(0, -1),
  ];
}

function isClosed(points: Point[], diagonal: number): boolean {
  return (
    distance(points[0], points[points.length - 1]) <
    diagonal * CLOSED_THRESHOLD
  );
}

function removeClosingPoint(
  points: Point[],
  diagonal: number
): Point[] {
  if (
    points.length > 3 &&
    distance(points[0], points[points.length - 1]) <
      diagonal * CLOSED_THRESHOLD
  ) {
    return points.slice(0, -1);
  }

  return points;
}

function recognizeCircle(
  points: Point[],
  bounds: ReturnType<typeof getBounds>
): boolean {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  const radiusX = bounds.width / 2;
  const radiusY = bounds.height / 2;

  if (radiusX < 1 || radiusY < 1) return false;

  const radii = points.map((point) => {
    const normalizedX = (point[0] - centerX) / radiusX;
    const normalizedY = (point[1] - centerY) / radiusY;

    return Math.hypot(normalizedX, normalizedY);
  });

  const mean =
    radii.reduce((sum, radius) => sum + radius, 0) /
    radii.length;

  const variance =
    radii.reduce(
      (sum, radius) => sum + (radius - mean) ** 2,
      0
    ) / radii.length;

  const deviation = Math.sqrt(variance);

  const aspectRatio =
    Math.min(bounds.width, bounds.height) /
    Math.max(bounds.width, bounds.height);

  return (
    mean > 0.65 &&
    deviation < 0.2 &&
    aspectRatio > 0.65
  );
}

function recognizeRectangle(
  corners: Point[]
): boolean {
  if (corners.length !== 4) return false;

  let rightAngleCount = 0;

  for (let i = 0; i < 4; i++) {
    const previous = corners[(i + 3) % 4];
    const current = corners[i];
    const next = corners[(i + 1) % 4];

    const ax = previous[0] - current[0];
    const ay = previous[1] - current[1];

    const bx = next[0] - current[0];
    const by = next[1] - current[1];

    const denominator =
      Math.hypot(ax, ay) * Math.hypot(bx, by);

    if (!denominator) continue;

    const cosine = Math.abs(
      (ax * bx + ay * by) / denominator
    );

    if (cosine < 0.35) {
      rightAngleCount++;
    }
  }

  return rightAngleCount >= 3;
}

function recognizeArrow(
  points: Point[],
  bounds: ReturnType<typeof getBounds>
): boolean {
  const simplified = simplify(
    points,
    Math.max(2, Math.hypot(bounds.width, bounds.height) * 0.025)
  );

  if (simplified.length < 4 || simplified.length > 8) {
    return false;
  }

  const start = simplified[0];
  const tip = simplified[simplified.length - 1];

  const shaftLength = distance(start, tip);

  if (shaftLength < MIN_DIAGONAL) return false;

  const shaftX = (tip[0] - start[0]) / shaftLength;
  const shaftY = (tip[1] - start[1]) / shaftLength;

  const candidates = simplified.slice(
    Math.max(1, simplified.length - 4),
    -1
  );

  let upperSide = false;
  let lowerSide = false;

  for (const candidate of candidates) {
    const dx = candidate[0] - tip[0];
    const dy = candidate[1] - tip[1];
    const length = Math.hypot(dx, dy);

    if (
      length < shaftLength * 0.08 ||
      length > shaftLength * 0.45
    ) {
      continue;
    }

    const dot =
      (dx * -shaftX + dy * -shaftY) / length;

    if (dot < 0.35 || dot > 0.95) continue;

    const cross = shaftX * dy - shaftY * dx;

    if (cross > 0) upperSide = true;
    if (cross < 0) lowerSide = true;
  }

  return upperSide && lowerSide;
}

function recognizeStraightShape(
  points: Point[],
  bounds: ReturnType<typeof getBounds>
): RecognizedShapeType | null {
  if (recognizeArrow(points, bounds)) {
    return 'arrow';
  }

  const directDistance = distance(
    points[0],
    points[points.length - 1]
  );

  const totalLength = pathLength(points);

  if (!totalLength) return null;

  return directDistance / totalLength >= STRAIGHTNESS_THRESHOLD
    ? 'line'
    : null;
}

function recognizeClosedShape(
  points: Point[],
  bounds: ReturnType<typeof getBounds>
): RecognizedShapeType | null {
  const diagonal = Math.hypot(bounds.width, bounds.height);

  const cleanPoints = removeClosingPoint(points, diagonal);

  const tolerance = Math.max(2, diagonal * 0.055);

  const corners = simplifyClosed(cleanPoints, tolerance);

  // Check circles before polygon corner classification.
  if (recognizeCircle(points, bounds)) {
    return 'circle';
  }

  if (corners.length === 3) {
    return 'triangle';
  }

  if (recognizeRectangle(corners)) {
    return 'rectangle';
  }

  return null;
}

export function recognizeShape(
  points: Point[]
): RecognizedShape | null {
  if (points.length < 8) return null;

  const bounds = getBounds(points);

  const diagonal = Math.hypot(
    bounds.width,
    bounds.height
  );

  if (diagonal < MIN_DIAGONAL) return null;

  let type: RecognizedShapeType | null;

  if (isClosed(points, diagonal)) {
    type = recognizeClosedShape(points, bounds);
  } else {
    type = recognizeStraightShape(points, bounds);
  }

  if (!type) return null;

  return {
    type,
    ...bounds,
  };
}
