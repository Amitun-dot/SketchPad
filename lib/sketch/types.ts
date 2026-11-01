
import { z } from 'zod';

export const INK_TOOLS = ['pen', 'pencil', 'highlighter'] as const;
export type InkTool = (typeof INK_TOOLS)[number];
export type ToolId = InkTool | 'eraser' | 'hand' | 'text' | 'shapes';
export const PAGE_BACKGROUNDS = [
  'blank',
  'lined',
  'grid',
  'dotted',
  'cream',
  'dark',
] as const;
export type PageBackground = (typeof PAGE_BACKGROUNDS)[number];

export const LEVELS = ['low', 'medium', 'high'] as const;
export type Level = (typeof LEVELS)[number];

export const RESPONSES = ['fast', 'balanced', 'smooth'] as const;
export type Response = (typeof RESPONSES)[number];

export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const COLOR_THEME_IDS = [
  'arctic-white',
  'midnight-black',
  'macos-silver',
  'warm-paper',
  'lavender-mist',
  'ocean-blue',
  'forest-green',
  'rose-quartz',
] as const;
export type ColorThemeId = (typeof COLOR_THEME_IDS)[number];

export type Point = [x: number, y: number, pressure: number];

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const strokeSchema = z.object({
  id: z.string().min(1).max(64),
  tool: z.enum(INK_TOOLS),
  color: colorSchema,
  size: z.number().min(0.1).max(200),
  opacity: z.number().min(0).max(1),
  thinning: z.number().min(0).max(1),
  smoothing: z.number().min(0).max(1),
  streamline: z.number().min(0).max(1),
  simulatePressure: z.boolean(),
  points: z.array(z.tuple([z.number(), z.number(), z.number()])).min(1),
});

export const SHAPE_TYPES = [
  'circle',
  'rectangle',
  'triangle',
  'line',
  'arrow',
] as const;

export const shapeSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(SHAPE_TYPES),
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
  color: colorSchema,
  size: z.number().min(0.1).max(200),
  opacity: z.number().min(0).max(1),
});

export type Shape = z.infer<typeof shapeSchema>;

export const textSchema = z.object({
  id: z.string().min(1).max(64),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  color: colorSchema,
  fontSize: z.number().min(1).max(300),
});

export type TextObject = z.infer<typeof textSchema>;

export const pageSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  background: z.enum(PAGE_BACKGROUNDS),
  strokes: z.array(strokeSchema),
  shapes: z.array(shapeSchema).default([]),
  texts: z.array(textSchema).default([]),
});

export const notebookSchema = z.object({
  format: z.literal('sketchpad'),
  version: z.literal(1),
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  pages: z.array(pageSchema).min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const toolStyleSchema = z.object({
  color: colorSchema,
  size: z.number().min(0.1).max(200),
  opacity: z.number().min(0.05).max(1),
});

export const preferencesSchema = z.object({
  styles: z.object({
    pen: toolStyleSchema,
    pencil: toolStyleSchema,
    highlighter: toolStyleSchema,
    shapes: toolStyleSchema,
  }),
  eraserSize: z.number().min(4).max(200),
  handwriting: z.object({
    smoothing: z.enum(LEVELS),
    stabilization: z.enum(LEVELS),
    response: z.enum(RESPONSES),
    thicknessSensitivity: z.number().min(0).max(1),
    naturalInk: z.boolean(),
  }),
  theme: z.enum(THEME_MODES),
  colorTheme: z.enum(COLOR_THEME_IDS).default('arctic-white'),
  recentColors: z.array(colorSchema).max(10),
});

export type Stroke = z.infer<typeof strokeSchema>;
export type StrokeSettings = Omit<Stroke, 'id' | 'points'>;
export type Page = z.infer<typeof pageSchema>;
export type NotebookDoc = z.infer<typeof notebookSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type ToolStyle = Preferences['styles']['pen'];
export type Handwriting = Preferences['handwriting'];
