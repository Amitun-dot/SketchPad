import { PointStabilizer } from './stabilizer';
import type { Handwriting, InkTool, Level, Response, StrokeSettings, ToolStyle } from './types';

const SMOOTHING: Record<Level, { streamline: number; smoothing: number }> = {
  low: { streamline: 0.2, smoothing: 0.5 },
  medium: { streamline: 0.4, smoothing: 0.65 },
  high: { streamline: 0.6, smoothing: 0.8 },
};

const HIGHLIGHTER_SHAPING = { streamline: 0.5, smoothing: 0.7 };

const STABILIZATION_CUTOFF: Record<Level, number> = { low: 4, medium: 2, high: 1 };

const RESPONSE_BETA: Record<Response, number> = { fast: 0.05, balanced: 0.02, smooth: 0.008 };

export function createStrokeSettings(
  tool: InkTool,
  style: ToolStyle,
  handwriting: Handwriting,
  hasPressure: boolean
): StrokeSettings {
  const isHighlighter = tool === 'highlighter';
  const shaping = isHighlighter ? HIGHLIGHTER_SHAPING : SMOOTHING[handwriting.smoothing];
  const pressureAware = hasPressure || handwriting.naturalInk;

  return {
    tool,
    color: style.color,
    size: style.size,
    opacity: style.opacity,
    thinning: isHighlighter || !pressureAware ? 0 : handwriting.thicknessSensitivity * 0.6,
    streamline: shaping.streamline,
    smoothing: shaping.smoothing,
    simulatePressure: !hasPressure && !isHighlighter && handwriting.naturalInk,
  };
}

export function createStabilizer(handwriting: Handwriting): PointStabilizer {
  return new PointStabilizer({
    minCutoff: STABILIZATION_CUTOFF[handwriting.stabilization],
    beta: RESPONSE_BETA[handwriting.response],
  });
}
