import type { InkTool, NotebookDoc, Page, PageBackground, Preferences } from './types';

export const PEN_COLORS = [
  { name: 'Black', hex: '#1C1C1E' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#E5484D' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Brown', hex: '#8B5E3C' },
  { name: 'Gray', hex: '#8E8E93' },
];

export const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', hex: '#FDE047' },
  { name: 'Green', hex: '#86EFAC' },
  { name: 'Pink', hex: '#F9A8D4' },
  { name: 'Blue', hex: '#93C5FD' },
  { name: 'Orange', hex: '#FDBA74' },
  { name: 'Purple', hex: '#C4B5FD' },
];

export const PALETTES: Record<InkTool, { name: string; hex: string }[]> = {
  pen: PEN_COLORS,
  pencil: PEN_COLORS,
  highlighter: HIGHLIGHTER_COLORS,
};

export const THICKNESS_RANGE: Record<InkTool, { min: number; max: number; presets: number[] }> = {
  pen: { min: 0.5, max: 24, presets: [1.5, 3, 5, 8] },
  pencil: { min: 0.5, max: 12, presets: [1.5, 2.5, 4, 6] },
  highlighter: { min: 6, max: 48, presets: [14, 22, 32, 44] },
};

export const DEFAULT_PREFERENCES: Preferences = {
  styles: {
  pen: { color: '#1C1C1E', size: 3.5, opacity: 1 },
  pencil: { color: '#4B4B52', size: 2.5, opacity: 0.7 },
  highlighter: { color: '#FDE047', size: 22, opacity: 0.4 },
  shapes: { color: '#1C1C1E', size: 3.5, opacity: 1 },
},
  eraserSize: 28,
  handwriting: {
    smoothing: 'medium',
    stabilization: 'medium',
    response: 'balanced',
    thicknessSensitivity: 0.5,
    naturalInk: true,
  },
  theme: 'system',
  colorTheme: 'arctic-white',
  recentColors: [],
};

export function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createPage(name: string, background: PageBackground = 'blank'): Page {
  return {
  id: createId(),
  name,
  background,
  strokes: [],
  shapes: [],
  texts: [],
};
}

export function createNotebook(): NotebookDoc {
  const now = Date.now();
  return {
    format: 'sketchpad',
    version: 1,
    id: createId(),
    name: 'Untitled notebook',
    pages: [createPage('Page 1')],
    createdAt: now,
    updatedAt: now,
  };
}
