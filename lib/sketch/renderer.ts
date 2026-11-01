
import { buildStrokePath, paintStrokes } from './paint';
import type { Page, Point, Shape, StrokeSettings, TextObject } from './types';
import { viewsEqual, type View } from './view';

export interface Scene {
  page: Page | null;
  view: View;
  deskColor: string;
}

export interface Overlay {
  ink?: { settings: StrokeSettings; points: Point[] };
  eraser?: { x: number; y: number; radius: number };
}

/**
 * Paints committed strokes, shapes and text on a base canvas
 * and in-progress ink on a second canvas.
 */
export class SketchRenderer {
  private baseCanvas: HTMLCanvasElement | null = null;
  private activeCanvas: HTMLCanvasElement | null = null;
  private baseCtx: CanvasRenderingContext2D | null = null;
  private activeCtx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private scene: Scene | null = null;
  private overlay: Overlay | null = null;
  private baseDirty = false;
  private activeDirty = false;
  private frame: number | null = null;

  attach(base: HTMLCanvasElement, active: HTMLCanvasElement): void {
    this.baseCanvas = base;
    this.activeCanvas = active;
    this.baseCtx = base.getContext('2d');
    this.activeCtx = active.getContext('2d');
  }

  resize(width: number, height: number, dpr: number): void {
    if (!this.baseCanvas || !this.activeCanvas) return;

    this.dpr = dpr;

    for (const canvas of [this.baseCanvas, this.activeCanvas]) {
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    }

    this.baseDirty = true;
    this.activeDirty = true;
    this.schedule();
  }

  setScene(scene: Scene): void {
    const previous = this.scene;
    this.scene = scene;

    const changed =
      !previous ||
      previous.page !== scene.page ||
      previous.deskColor !== scene.deskColor ||
      !viewsEqual(previous.view, scene.view);

    if (changed) {
      this.baseDirty = true;
      this.schedule();
    }
  }

  setOverlay(overlay: Overlay | null): void {
    this.overlay = overlay;
    this.activeDirty = true;
    this.schedule();
  }

  destroy(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);

    this.frame = null;
    this.baseCanvas = null;
    this.activeCanvas = null;
    this.baseCtx = null;
    this.activeCtx = null;
  }

  private schedule(): void {
    if (this.frame === null) {
      this.frame = requestAnimationFrame(this.flush);
    }
  }

  private flush = (): void => {
    this.frame = null;

    if (this.baseDirty) {
      this.baseDirty = false;
      this.paintBase();
    }

    if (this.activeDirty) {
      this.activeDirty = false;
      this.paintActive();
    }
  };

  private paintBase(): void {
    const ctx = this.baseCtx;
    const scene = this.scene;

    if (!ctx || !scene || !this.baseCanvas) return;

    const { dpr } = this;
    const { zoom, panX, panY } = scene.view;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = scene.deskColor;
    ctx.fillRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);

    if (!scene.page) return;

    ctx.setTransform(
      dpr * zoom,
      0,
      0,
      dpr * zoom,
      dpr * panX,
      dpr * panY
    );

    paintStrokes(ctx, scene.page.strokes);
    this.paintShapes(ctx, scene.page.shapes ?? []);
    this.paintTexts(ctx, scene.page.texts ?? []);
  }

  private paintShapes(ctx: CanvasRenderingContext2D, shapes: Shape[]): void {
    for (const shape of shapes) {
      ctx.save();

      ctx.globalAlpha = shape.opacity;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const { x, y, width, height } = shape;

      ctx.beginPath();

      switch (shape.type) {
        case 'circle':
          ctx.ellipse(
            x + width / 2,
            y + height / 2,
            Math.abs(width / 2),
            Math.abs(height / 2),
            0,
            0,
            Math.PI * 2
          );
          break;

        case 'rectangle':
          ctx.rect(x, y, width, height);
          break;

        case 'triangle':
          ctx.moveTo(x + width / 2, y);
          ctx.lineTo(x + width, y + height);
          ctx.lineTo(x, y + height);
          ctx.closePath();
          break;

        case 'line':
          ctx.moveTo(x, y);
          ctx.lineTo(x + width, y + height);
          break;

        case 'arrow': {
          const endX = x + width;
          const endY = y + height;
          const angle = Math.atan2(height, width);
          const headLength = Math.max(10, shape.size * 4);

          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);

          ctx.moveTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(endX, endY);
          ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
          );
          break;
        }
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  private paintTexts(ctx: CanvasRenderingContext2D, texts: TextObject[]): void {
    for (const item of texts) {
      ctx.save();

      ctx.globalAlpha = 1;
      ctx.fillStyle = item.color;
      ctx.font = `${item.fontSize}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      const lines = item.text.split('\n');
      const lineHeight = item.fontSize * 1.2;

      lines.forEach((line, index) => {
        ctx.fillText(line, item.x, item.y + index * lineHeight);
      });

      ctx.restore();
    }
  }

  private paintActive(): void {
    const ctx = this.activeCtx;

    if (!ctx || !this.activeCanvas) return;

    const { dpr } = this;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.activeCanvas.width, this.activeCanvas.height);

    const overlay = this.overlay;
    if (!overlay) return;

    if (overlay.ink && this.scene) {
      const { zoom, panX, panY } = this.scene.view;
      const { settings, points } = overlay.ink;

      ctx.setTransform(
        dpr * zoom,
        0,
        0,
        dpr * zoom,
        dpr * panX,
        dpr * panY
      );

      ctx.globalAlpha = settings.opacity;
      ctx.fillStyle = settings.color;
      ctx.fill(buildStrokePath(settings, points, false));
      ctx.globalAlpha = 1;
    }

    if (overlay.eraser) {
      const { x, y, radius } = overlay.eraser;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120, 120, 128, 0.14)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(60, 60, 67, 0.7)';
      ctx.stroke();
    }
  }
}
