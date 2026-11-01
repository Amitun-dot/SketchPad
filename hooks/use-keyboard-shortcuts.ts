import { useEffect } from 'react';
import { useSketchStore } from '@/lib/store/sketch-store';
import type { ToolId } from '@/lib/sketch/types';

const TOOL_KEYS: Record<string, ToolId> = {
  p: 'pen',
  d: 'pencil',
  h: 'highlighter',
  e: 'eraser',
  g: 'hand',
};

const ZOOM_STEP = 1.2;

interface ShortcutHandlers {
  onSave: () => void;
  onExportPage: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function useKeyboardShortcuts({ onSave, onExportPage }: ShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.metaKey || event.ctrlKey;
      const typing = isTypingTarget(event.target);

      if (modifier && key === 's') {
        event.preventDefault();
        onSave();
        return;
      }
      if (typing) return;

      const store = useSketchStore.getState();

      if (modifier && key === 'e') {
        event.preventDefault();
        onExportPage();
        return;
      }
      if (modifier && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (modifier && key === 'y') {
        event.preventDefault();
        store.redo();
        return;
      }
      if (modifier || event.altKey) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) store.setPanHeld(true);
        return;
      }

      if (event.key === '+' || event.key === '=') {
        store.zoomBy(ZOOM_STEP);
      } else if (event.key === '-' || event.key === '_') {
        store.zoomBy(1 / ZOOM_STEP);
      } else if (event.key === '0') {
        store.resetView();
      } else if (event.key === 'Escape') {
        store.setTool('pen');
      } else if (TOOL_KEYS[key]) {
        store.setTool(TOOL_KEYS[key]);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') useSketchStore.getState().setPanHeld(false);
    };
    const handleBlur = () => useSketchStore.getState().setPanHeld(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onSave, onExportPage]);
}
