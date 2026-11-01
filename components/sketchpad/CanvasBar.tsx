'use client';

import { useState } from 'react';
import { Maximize2, Minus, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { selectCurrentPage, useSketchStore } from '@/lib/store/sketch-store';
import { IconButton } from './IconButton';

export function CanvasBar() {
  const page = useSketchStore(selectCurrentPage);
  const zoom = useSketchStore((state) => state.view.zoom);
  const hasStrokes = (page?.strokes.length ?? 0) > 0;
  const [confirmClear, setConfirmClear] = useState(false);
  const store = useSketchStore.getState;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3 sm:bottom-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
        <IconButton label="Zoom out" onClick={() => store().zoomBy(1 / 1.2)}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        <button
          type="button"
          onClick={() => store().resetView()}
          title="Reset view (0)"
          className="w-14 rounded-lg py-1.5 text-center font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton label="Zoom in" onClick={() => store().zoomBy(1.2)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        <IconButton label="Reset view" onClick={() => store().resetView()}>
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <div className="mx-1 h-5 w-px bg-border" />

        <IconButton label="Clear canvas" disabled={!hasStrokes} onClick={() => setConfirmClear(true)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              All drawing will be removed. You can undo this with Ctrl+Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => page && store().clearPage(page.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
