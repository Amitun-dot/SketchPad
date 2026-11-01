import { selectNotebookDoc, useSketchStore } from '@/lib/store/sketch-store';
import { paintStrokes } from './paint';
import { notebookSchema, type NotebookDoc, type Stroke } from './types';

const EXPORT_SCALE = 2;
const EXPORT_PADDING = 32;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeFileName(name: string): string {
  return name.replace(/[^\w\- ]+/g, '').trim() || 'SketchPad';
}

function strokesBounds(strokes: Stroke[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    const pad = stroke.size;
    for (const [x, y] of stroke.points) {
      minX = Math.min(minX, x - pad);
      minY = Math.min(minY, y - pad);
      maxX = Math.max(maxX, x + pad);
      maxY = Math.max(maxY, y + pad);
    }
  }
  return { minX, minY, maxX, maxY };
}

export async function exportDrawingPng(strokes: Stroke[], notebookName: string): Promise<void> {
  if (strokes.length === 0) throw new Error('There is nothing to export yet.');
  const bounds = strokesBounds(strokes);
  const width = bounds.maxX - bounds.minX + EXPORT_PADDING * 2;
  const height = bounds.maxY - bounds.minY + EXPORT_PADDING * 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * EXPORT_SCALE);
  canvas.height = Math.ceil(height * EXPORT_SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image export is not supported by this browser.');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  ctx.translate(EXPORT_PADDING - bounds.minX, EXPORT_PADDING - bounds.minY);
  paintStrokes(ctx, strokes);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The drawing could not be converted to an image.');
  downloadBlob(blob, `${safeFileName(notebookName)}.png`);
}

export function exportNotebookFile(doc: NotebookDoc): void {
  const blob = new Blob([JSON.stringify(doc)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(doc.name)}.sketchpad`);
}

export async function exportCurrentDrawing(): Promise<void> {
  const state = useSketchStore.getState();
  const strokes = state.pages.flatMap((page) => page.strokes);
  await exportDrawingPng(strokes, state.notebookName);
}

export function exportCurrentNotebook(): void {
  exportNotebookFile(selectNotebookDoc(useSketchStore.getState()));
}

export function parseNotebookFile(text: string): NotebookDoc {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid SketchPad notebook.');
  }
  const parsed = notebookSchema.safeParse(json);
  if (!parsed.success) throw new Error('This file is not a valid SketchPad notebook.');
  return parsed.data;
}
