const TAU = Math.PI * 2;
const DERIVATIVE_CUTOFF = 1;

export interface StabilizerOptions {
  minCutoff: number;
  beta: number;
}

function smoothingFactor(dt: number, cutoff: number): number {
  const tau = 1 / (TAU * cutoff);
  return 1 / (1 + tau / dt);
}

class AxisFilter {
  private value: number | null = null;
  private velocity = 0;

  constructor(
    private readonly minCutoff: number,
    private readonly beta: number
  ) {}

  next(raw: number, dt: number): number {
    if (this.value === null) {
      this.value = raw;
      return raw;
    }
    const rawVelocity = (raw - this.value) / dt;
    this.velocity += smoothingFactor(dt, DERIVATIVE_CUTOFF) * (rawVelocity - this.velocity);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.velocity);
    this.value += smoothingFactor(dt, cutoff) * (raw - this.value);
    return this.value;
  }
}

/** One Euro filter: removes hand jitter when slow, keeps lag low when moving fast. */
export class PointStabilizer {
  private readonly xAxis: AxisFilter;
  private readonly yAxis: AxisFilter;
  private lastTime: number | null = null;

  constructor(options: StabilizerOptions) {
    this.xAxis = new AxisFilter(options.minCutoff, options.beta);
    this.yAxis = new AxisFilter(options.minCutoff, options.beta);
  }

  filter(x: number, y: number, timeMs: number): [number, number] {
    const rawDt = this.lastTime === null ? 1 / 60 : (timeMs - this.lastTime) / 1000;
    this.lastTime = timeMs;
    const dt = Math.min(0.1, Math.max(0.001, rawDt));
    return [this.xAxis.next(x, dt), this.yAxis.next(y, dt)];
  }
}
