
import { create } from 'zustand';

import { DEFAULT_PREFERENCES } from '@/lib/sketch/defaults';
import { eraseAlongSegment } from '@/lib/sketch/erase';
import { clampZoom, initialView, zoomAt, type View } from '@/lib/sketch/view';

import type {
  ColorThemeId,
  InkTool,
  Handwriting,
  NotebookDoc,
  Page,
  Preferences,
  Shape,
  Stroke,
  TextObject,
  ThemeMode,
  ToolId,
  ToolStyle,
} from '@/lib/sketch/types';

const HISTORY_LIMIT = 200;
const RECENT_COLOR_LIMIT = 10;

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

interface SketchState {
  ready: boolean;
  notebookId: string;
  notebookName: string;
  createdAt: number;
  pages: Page[];
  currentPageId: string;
  past: Page[][];
  future: Page[][];
  gestureBase: Page[] | null;
  tool: ToolId;
  panHeld: boolean;
  view: View;
  viewport: { width: number; height: number };
  viewFitted: boolean;
  systemDark: boolean;
  preferences: Preferences;
  saveStatus: SaveStatus;
  saveError: string | null;
}

interface SketchActions {
  load(doc: NotebookDoc, preferences: Preferences): void;
  setNotebookName(name: string): void;
  setTool(tool: ToolId): void;
  setPanHeld(held: boolean): void;
  setView(patch: Partial<View>): void;
  setViewport(width: number, height: number): void;
  resetView(): void;
  zoomBy(factor: number): void;
  zoomTo(zoom: number): void;
  setSystemDark(dark: boolean): void;
  updateToolStyle(tool: InkTool, patch: Partial<ToolStyle>): void;
  updateShapeStyle(patch: Partial<ToolStyle>): void;
  setEraserSize(size: number): void;
  updateHandwriting(patch: Partial<Handwriting>): void;
  setThemeMode(theme: ThemeMode): void;
  setColorTheme(colorTheme: ColorThemeId): void;
  addRecentColor(color: string): void;
  appendStroke(stroke: Stroke): void;
  appendShape(shape: Shape): void;
  appendText(text: TextObject): void;
  updateText(id: string, updates: Partial<Omit<TextObject, 'id'>>): void;
  moveText(id: string, x: number, y: number): void;
  removeText(id: string): void;
  beginEdit(): void;
  endEdit(): void;
  eraseSegment(
    from: [number, number],
    to: [number, number],
    radius: number
  ): void;
  undo(): void;
  redo(): void;
  clearPage(id: string): void;
  setSaveStatus(status: SaveStatus, error?: string | null): void;
}

export type SketchStore = SketchState & SketchActions;

function resolvePageId(pages: Page[], id: string): string {
  return pages.some((page) => page.id === id) ? id : (pages[0]?.id ?? '');
}

function pushHistory(past: Page[][], snapshot: Page[]): Page[][] {
  return [...past, snapshot].slice(-HISTORY_LIMIT);
}

function commitPages(
  state: SketchState,
  pages: Page[],
  currentPageId: string = state.currentPageId
): Partial<SketchState> {
  if (pages === state.pages) return {};

  return {
    past: pushHistory(state.past, state.pages),
    future: [],
    pages,
    currentPageId: resolvePageId(pages, currentPageId),
  };
}

function mapCurrentStrokes(
  state: SketchState,
  transform: (strokes: Stroke[]) => Stroke[]
): Page[] {
  let changed = false;

  const pages = state.pages.map((page) => {
    if (page.id !== state.currentPageId) return page;

    const strokes = transform(page.strokes);

    if (strokes === page.strokes) return page;

    changed = true;
    return { ...page, strokes };
  });

  return changed ? pages : state.pages;
}

function updatePageWith(
  pages: Page[],
  id: string,
  update: (page: Page) => Page
): Page[] {
  return pages.map((page) => (page.id === id ? update(page) : page));
}

function segmentIntersectsRect(
  from: [number, number],
  to: [number, number],
  left: number,
  top: number,
  right: number,
  bottom: number
): boolean {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];

  let tMin = 0;
  let tMax = 1;

  const checks: [number, number][] = [
    [-dx, from[0] - left],
    [dx, right - from[0]],
    [-dy, from[1] - top],
    [dy, bottom - from[1]],
  ];

  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }

    const t = q / p;

    if (p < 0) tMin = Math.max(tMin, t);
    else tMax = Math.min(tMax, t);

    if (tMin > tMax) return false;
  }

  return true;
}

export const useSketchStore = create<SketchStore>()((set, get) => ({
  ready: false,
  notebookId: '',
  notebookName: '',
  createdAt: 0,
  pages: [],
  currentPageId: '',
  past: [],
  future: [],
  gestureBase: null,
  tool: 'pen',
  panHeld: false,
  view: { zoom: 1, panX: 0, panY: 0 },
  viewport: { width: 0, height: 0 },
  viewFitted: false,
  systemDark: false,
  preferences: DEFAULT_PREFERENCES,
  saveStatus: 'idle',
  saveError: null,

  load: (doc, preferences) => {
    const [first] = doc.pages;

    const canvas: Page = {
      ...first,
      strokes: doc.pages.flatMap((page) => page.strokes),
      shapes: doc.pages.flatMap((page) => page.shapes ?? []),
      texts: doc.pages.flatMap((page) => page.texts ?? []),
    };

    set({
      ready: true,
      notebookId: doc.id,
      notebookName: doc.name,
      createdAt: doc.createdAt,
      pages: [canvas],
      currentPageId: canvas.id,
      past: [],
      future: [],
      gestureBase: null,
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...preferences,
        styles: {
          ...DEFAULT_PREFERENCES.styles,
          ...preferences.styles,
        },
        handwriting: {
          ...DEFAULT_PREFERENCES.handwriting,
          ...preferences.handwriting,
        },
      },
    });
  },

  setNotebookName: (name) => set({ notebookName: name }),
  setTool: (tool) => set({ tool }),
  setPanHeld: (held) => set({ panHeld: held }),

  setView: (patch) =>
    set((state) => ({ view: { ...state.view, ...patch } })),

  setViewport: (width, height) => {
    if (width <= 0 || height <= 0) return;

    if (get().viewFitted) {
      set({ viewport: { width, height } });
      return;
    }

    set({
      viewport: { width, height },
      view: initialView(width, height),
      viewFitted: true,
    });
  },

  resetView: () => {
    const { viewport } = get();
    if (viewport.width <= 0) return;
    set({ view: initialView(viewport.width, viewport.height) });
  },

  zoomBy: (factor) => {
    const { viewport, view } = get();
    set({
      view: zoomAt(
        view,
        viewport.width / 2,
        viewport.height / 2,
        view.zoom * factor
      ),
    });
  },

  zoomTo: (zoom) => {
    const { viewport, view } = get();
    set({
      view: zoomAt(
        view,
        viewport.width / 2,
        viewport.height / 2,
        clampZoom(zoom)
      ),
    });
  },

  setSystemDark: (dark) => set({ systemDark: dark }),

  updateToolStyle: (tool, patch) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        styles: {
          ...state.preferences.styles,
          [tool]: { ...state.preferences.styles[tool], ...patch },
        },
      },
    })),

  updateShapeStyle: (patch) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        styles: {
          ...state.preferences.styles,
          shapes: {
            ...state.preferences.styles.shapes,
            ...patch,
          },
        },
      },
    })),

  setEraserSize: (size) =>
    set((state) => ({
      preferences: { ...state.preferences, eraserSize: size },
    })),

  updateHandwriting: (patch) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        handwriting: { ...state.preferences.handwriting, ...patch },
      },
    })),

  setThemeMode: (theme) =>
    set((state) => ({
      preferences: { ...state.preferences, theme },
    })),

  setColorTheme: (colorTheme) =>
    set((state) => ({
      preferences: { ...state.preferences, colorTheme },
    })),

  addRecentColor: (color) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        recentColors: [
          color,
          ...state.preferences.recentColors.filter((c) => c !== color),
        ].slice(0, RECENT_COLOR_LIMIT),
      },
    })),

  appendStroke: (stroke) =>
    set((state) =>
      commitPages(
        state,
        mapCurrentStrokes(state, (strokes) => [...strokes, stroke])
      )
    ),

  appendShape: (shape) =>
    set((state) => {
      const pages = updatePageWith(
        state.pages,
        state.currentPageId,
        (page) => ({
          ...page,
          shapes: [...(page.shapes ?? []), shape],
        })
      );
      return commitPages(state, pages);
    }),

  appendText: (text) =>
    set((state) => {
      const pages = updatePageWith(
        state.pages,
        state.currentPageId,
        (page) => ({
          ...page,
          texts: [...(page.texts ?? []), text],
        })
      );
      return commitPages(state, pages);
    }),

  updateText: (id, updates) =>
    set((state) => {
      const pages = updatePageWith(
        state.pages,
        state.currentPageId,
        (page) => ({
          ...page,
          texts: (page.texts ?? []).map((text) =>
            text.id === id ? { ...text, ...updates } : text
          ),
        })
      );
      return commitPages(state, pages);
    }),

  moveText: (id, x, y) =>
    set((state) => ({
      pages: updatePageWith(
        state.pages,
        state.currentPageId,
        (page) => ({
          ...page,
          texts: (page.texts ?? []).map((text) =>
            text.id === id ? { ...text, x, y } : text
          ),
        })
      ),
    })),

  removeText: (id) =>
    set((state) => {
      const pages = updatePageWith(
        state.pages,
        state.currentPageId,
        (page) => ({
          ...page,
          texts: (page.texts ?? []).filter((text) => text.id !== id),
        })
      );
      return commitPages(state, pages);
    }),

  beginEdit: () =>
    set((state) => ({
      gestureBase: state.gestureBase ?? state.pages,
    })),

  endEdit: () =>
    set((state) => {
      if (!state.gestureBase || state.gestureBase === state.pages) {
        return { gestureBase: null };
      }

      return {
        gestureBase: null,
        past: pushHistory(state.past, state.gestureBase),
        future: [],
      };
    }),

  eraseSegment: (from, to, radius) =>
    set((state) => {
      const pages = state.pages.map((page) => {
        if (page.id !== state.currentPageId) return page;

        const strokes = eraseAlongSegment(page.strokes, from, to, radius);

        const shapes = (page.shapes ?? []).filter((shape) => {
          return !segmentIntersectsRect(
            from,
            to,
            shape.x - radius,
            shape.y - radius,
            shape.x + shape.width + radius,
            shape.y + shape.height + radius
          );
        });

        const texts = (page.texts ?? []).filter((text) => {
          const lines = text.text.split('\n');
          const width = Math.max(
            text.fontSize,
            ...lines.map((line) => line.length * text.fontSize * 0.62)
          );
          const height = lines.length * text.fontSize * 1.2;

          return !segmentIntersectsRect(
            from,
            to,
            text.x - radius,
            text.y - radius,
            text.x + width + radius,
            text.y + height + radius
          );
        });

        if (
          strokes === page.strokes &&
          shapes.length === (page.shapes ?? []).length &&
          texts.length === (page.texts ?? []).length
        ) {
          return page;
        }

        return { ...page, strokes, shapes, texts };
      });

      return pages.some((page, index) => page !== state.pages[index])
        ? { pages }
        : {};
    }),

  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return {};

      return {
        past: state.past.slice(0, -1),
        future: [state.pages, ...state.future].slice(0, HISTORY_LIMIT),
        pages: previous,
        currentPageId: resolvePageId(previous, state.currentPageId),
      };
    }),

  redo: () =>
    set((state) => {
      const [next, ...rest] = state.future;
      if (!next) return {};

      return {
        past: pushHistory(state.past, state.pages),
        future: rest,
        pages: next,
        currentPageId: resolvePageId(next, state.currentPageId),
      };
    }),

  clearPage: (id) =>
    set((state) => {
      const page = state.pages.find((p) => p.id === id);

      if (
        !page ||
        (
          page.strokes.length === 0 &&
          (page.shapes ?? []).length === 0 &&
          (page.texts ?? []).length === 0
        )
      ) {
        return {};
      }

      return commitPages(
        state,
        updatePageWith(state.pages, id, (p) => ({
          ...p,
          strokes: [],
          shapes: [],
          texts: [],
        }))
      );
    }),

  setSaveStatus: (status, error = null) =>
    set({ saveStatus: status, saveError: error }),
}));

export function selectCurrentPage(state: SketchStore): Page | null {
  return state.pages.find((page) => page.id === state.currentPageId) ?? null;
}

export function selectIsDark(state: SketchStore): boolean {
  const { theme } = state.preferences;
  return theme === 'dark' || (theme === 'system' && state.systemDark);
}

export function selectNotebookDoc(state: SketchStore): NotebookDoc {
  return {
    format: 'sketchpad',
    version: 1,
    id: state.notebookId,
    name: state.notebookName,
    pages: state.pages,
    createdAt: state.createdAt,
    updatedAt: Date.now(),
  };
}
