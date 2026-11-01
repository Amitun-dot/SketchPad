
import { createStabilizer, createStrokeSettings } from './ink';
import type { SketchRenderer } from './renderer';
import type { PointStabilizer } from './stabilizer';
import { screenToWorld, zoomAt, type View } from './view';
import { createId } from './defaults';
import { recognizeShape } from './shape-recognition';

import {
  INK_TOOLS,
  type InkTool,
  type Point,
  type Preferences,
  type Shape,
  type Stroke,
  type StrokeSettings,
  type TextObject,
  type ToolId,
} from './types';

export interface InputSnapshot {
  tool: ToolId;
  view: View;
  panHeld: boolean;
  preferences: Preferences;
}

export interface InputHooks {
  read(): InputSnapshot;
  setView(patch: Partial<View>): void;
  commitStroke(stroke: Stroke): void;
  commitShape(shape: Shape): void;
  startText(point: [number, number]): void;
  findTextAt(point: [number, number]): TextObject | null;
  moveText(id: string, x: number, y: number): void;
  beginEdit(): void;
  endEdit(): void;
  eraseSegment(
    from: [number, number],
    to: [number, number],
    radius: number
  ): void;
}

interface InkSession {
  settings: StrokeSettings;
  points: Point[];
  stabilizer: PointStabilizer;
  hasPressure: boolean;
}

const MIN_POINT_SPACING = 0.6;
const WHEEL_ZOOM_SENSITIVITY = 0.0018;
const TEXT_DRAG_THRESHOLD = 3;

function isInkTool(tool: ToolId): tool is InkTool {
  return (INK_TOOLS as readonly ToolId[]).includes(tool);
}

type Mode = 'idle' | 'ink' | 'shape' | 'erase' | 'pan' | 'move-text';

export class InputController {
  private mode: Mode = 'idle';
  private activePointer = -1;
  private ink: InkSession | null = null;
  private eraseLast: [number, number] | null = null;

  private movingText: TextObject | null = null;
  private textStart: [number, number] = [0, 0];
  private textOrigin: [number, number] = [0, 0];
  private textMoved = false;

  private panOrigin = {
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  };

  constructor(
    private readonly element: HTMLElement,
    private readonly renderer: SketchRenderer,
    private readonly hooks: InputHooks
  ) {}

  attach(): () => void {
    const el = this.element;

    el.addEventListener('pointerdown', this.handleDown);
    el.addEventListener('pointermove', this.handleMove);
    el.addEventListener('pointerup', this.handleUp);
    el.addEventListener('pointercancel', this.handleCancel);
    el.addEventListener('pointerleave', this.handleLeave);
    el.addEventListener('wheel', this.handleWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', this.handleDown);
      el.removeEventListener('pointermove', this.handleMove);
      el.removeEventListener('pointerup', this.handleUp);
      el.removeEventListener('pointercancel', this.handleCancel);
      el.removeEventListener('pointerleave', this.handleLeave);
      el.removeEventListener('wheel', this.handleWheel);
    };
  }

  private screenPoint(event: {
    clientX: number;
    clientY: number;
  }): [number, number] {
    const rect = this.element.getBoundingClientRect();

    return [
      event.clientX - rect.left,
      event.clientY - rect.top,
    ];
  }

  private worldPoint(
    event: { clientX: number; clientY: number },
    view: View
  ): [number, number] {
    const [sx, sy] = this.screenPoint(event);
    return screenToWorld(view, sx, sy);
  }

  private eraserRadiusWorld(snapshot: InputSnapshot): number {
    return snapshot.preferences.eraserSize / 2 / snapshot.view.zoom;
  }

  private showEraser(
    event: { clientX: number; clientY: number },
    snapshot: InputSnapshot
  ): void {
    const [x, y] = this.screenPoint(event);

    this.renderer.setOverlay({
      eraser: {
        x,
        y,
        radius: snapshot.preferences.eraserSize / 2,
      },
    });
  }

  private addInkPoint(event: PointerEvent, view: View): void {
    const session = this.ink;
    if (!session) return;

    const [wx, wy] = this.worldPoint(event, view);
    const [x, y] = session.stabilizer.filter(wx, wy, event.timeStamp);
    const last = session.points[session.points.length - 1];

    if (
      last &&
      Math.hypot(x - last[0], y - last[1]) < MIN_POINT_SPACING
    ) {
      return;
    }

    const pressure = session.hasPressure
      ? Math.min(1, Math.max(0, event.pressure))
      : 0.5;

    session.points.push([x, y, pressure]);
  }

  private publishInk(): void {
    if (!this.ink) return;

    this.renderer.setOverlay({
      ink: {
        settings: this.ink.settings,
        points: this.ink.points,
      },
    });
  }

  private createInkSession(
  snapshot: InputSnapshot,
  event: PointerEvent,
  tool: InkTool,
  customStyle?: Preferences['styles'][InkTool]
): void {
  const hasPressure =
    event.pointerType === 'pen' && event.pressure > 0;

  const { handwriting, styles } = snapshot.preferences;

  this.ink = {
    settings: createStrokeSettings(
      tool,
      customStyle ?? styles[tool],
      handwriting,
      hasPressure
    ),
    points: [],
    stabilizer: createStabilizer(handwriting),
    hasPressure,
  };

  this.addInkPoint(event, snapshot.view);
  this.publishInk();
}

  private handleDown = (event: PointerEvent): void => {
    if (this.mode !== 'idle') return;

    if (
      event.pointerType === 'mouse' &&
      event.button !== 0 &&
      event.button !== 1
    ) {
      return;
    }

    const snapshot = this.hooks.read();

    const isPanGesture =
      event.button === 1 ||
      snapshot.panHeld ||
      snapshot.tool === 'hand';

    if (!isPanGesture && snapshot.tool === 'text') {
      if (event.button !== 0) return;

      event.preventDefault();

      const point = this.worldPoint(event, snapshot.view);
      const text = this.hooks.findTextAt(point);

      if (text) {
        this.mode = 'move-text';
        this.activePointer = event.pointerId;
        this.movingText = text;
        this.textStart = point;
        this.textOrigin = [text.x, text.y];
        this.textMoved = false;

        this.element.setPointerCapture(event.pointerId);
        return;
      }

      this.hooks.startText(point);
      return;
    }

    if (
      !isPanGesture &&
      snapshot.tool !== 'eraser' &&
      snapshot.tool !== 'shapes' &&
      !isInkTool(snapshot.tool)
    ) {
      return;
    }

    event.preventDefault();

    this.element.setPointerCapture(event.pointerId);
    this.activePointer = event.pointerId;

    if (isPanGesture) {
      this.mode = 'pan';

      this.panOrigin = {
        x: event.clientX,
        y: event.clientY,
        panX: snapshot.view.panX,
        panY: snapshot.view.panY,
      };

      return;
    }

    if (snapshot.tool === 'eraser') {
      this.mode = 'erase';

      const point = this.worldPoint(event, snapshot.view);

      this.hooks.beginEdit();
      this.eraseLast = point;

      this.hooks.eraseSegment(
        point,
        point,
        this.eraserRadiusWorld(snapshot)
      );

      this.showEraser(event, snapshot);
      return;
    }

    if (snapshot.tool === 'shapes') {
  this.mode = 'shape';

  // Shapes use their own independent style settings.
  this.createInkSession(
    snapshot,
    event,
    'pen',
    snapshot.preferences.styles.shapes
  );

  return;
}

    if (isInkTool(snapshot.tool)) {
      this.mode = 'ink';
      this.createInkSession(snapshot, event, snapshot.tool);
    }
  };

  private handleMove = (event: PointerEvent): void => {
    if (this.mode === 'idle') {
      const snapshot = this.hooks.read();

      if (
        snapshot.tool === 'eraser' &&
        event.pointerType !== 'touch'
      ) {
        this.showEraser(event, snapshot);
      }

      return;
    }

    if (event.pointerId !== this.activePointer) return;

    const snapshot = this.hooks.read();

    const coalesced =
      typeof event.getCoalescedEvents === 'function'
        ? event.getCoalescedEvents()
        : [];

    const events = coalesced.length > 0 ? coalesced : [event];

    if (this.mode === 'move-text' && this.movingText) {
      const point = this.worldPoint(event, snapshot.view);

      const dx = point[0] - this.textStart[0];
      const dy = point[1] - this.textStart[1];

      if (
        !this.textMoved &&
        Math.hypot(dx, dy) < TEXT_DRAG_THRESHOLD
      ) {
        return;
      }

      if (!this.textMoved) {
        this.textMoved = true;
        this.hooks.beginEdit();
      }

      this.hooks.moveText(
        this.movingText.id,
        this.textOrigin[0] + dx,
        this.textOrigin[1] + dy
      );

      return;
    }

    if (this.mode === 'pan') {
      this.hooks.setView({
        panX:
          this.panOrigin.panX +
          (event.clientX - this.panOrigin.x),
        panY:
          this.panOrigin.panY +
          (event.clientY - this.panOrigin.y),
      });
      return;
    }

    if (this.mode === 'ink' || this.mode === 'shape') {
      for (const ev of events) {
        this.addInkPoint(ev, snapshot.view);
      }

      this.publishInk();
      return;
    }

    if (this.mode === 'erase') {
      const radius = this.eraserRadiusWorld(snapshot);

      for (const ev of events) {
        const point = this.worldPoint(ev, snapshot.view);

        if (this.eraseLast) {
          this.hooks.eraseSegment(this.eraseLast, point, radius);
        }

        this.eraseLast = point;
      }

      this.showEraser(event, snapshot);
    }
  };

  private handleUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer) return;

    if (this.mode === 'move-text' && this.movingText) {
      if (this.textMoved) {
        this.hooks.endEdit();
      } else {
        this.hooks.startText([
          this.movingText.x,
          this.movingText.y,
        ]);
      }

      this.movingText = null;
      this.textMoved = false;
      this.mode = 'idle';
      this.activePointer = -1;
      return;
    }

    this.finish(true);
  };

  private handleCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer) return;

    if (this.mode === 'move-text' && this.movingText) {
      if (this.textMoved) {
        this.hooks.moveText(
          this.movingText.id,
          this.textOrigin[0],
          this.textOrigin[1]
        );
        this.hooks.endEdit();
      }

      this.movingText = null;
      this.textMoved = false;
      this.mode = 'idle';
      this.activePointer = -1;
      return;
    }

    this.finish(false);
  };

  private handleLeave = (): void => {
    if (this.mode === 'idle') {
      this.renderer.setOverlay(null);
    }
  };

  private finish(commit: boolean): void {
    if (this.ink) {
      const session = this.ink;

      if (commit && session.points.length > 0) {
        if (this.mode === 'shape') {
          // Shape recognition runs ONLY in Shapes mode.
          const recognized = recognizeShape(session.points);

          if (recognized) {
            this.hooks.commitShape({
              id: createId(),
              ...recognized,
              color: session.settings.color,
              size: session.settings.size,
              opacity: session.settings.opacity,
            });
          }
          // Unrecognized drawings in Shapes mode are discarded.
        } else if (this.mode === 'ink') {
          // Pen, Pencil and Highlighter always remain freehand.
          this.hooks.commitStroke({
            id: createId(),
            ...session.settings,
            points: session.points,
          });
        }
      }

      this.ink = null;
    }

    if (this.mode === 'erase') {
      this.hooks.endEdit();
    }

    this.eraseLast = null;
    this.mode = 'idle';
    this.activePointer = -1;

    this.renderer.setOverlay(null);
  }

  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();

    const snapshot = this.hooks.read();

    if (event.shiftKey) {
      this.hooks.setView({
        panX: snapshot.view.panX - (event.deltaY || event.deltaX),
      });
      return;
    }

    if (event.deltaX !== 0) {
      this.hooks.setView({
        panX: snapshot.view.panX - event.deltaX,
        panY: snapshot.view.panY - event.deltaY,
      });
      return;
    }

    const [sx, sy] = this.screenPoint(event);

    const factor = Math.exp(
      -event.deltaY * WHEEL_ZOOM_SENSITIVITY
    );

    const next = zoomAt(
      snapshot.view,
      sx,
      sy,
      snapshot.view.zoom * factor
    );

    this.hooks.setView(next);
  };
}
