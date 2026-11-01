'use client';

import { useCallback, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { useAutosave } from '@/hooks/use-autosave';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { exportCurrentDrawing } from '@/lib/sketch/export';
import { createNotebook, DEFAULT_PREFERENCES } from '@/lib/sketch/defaults';
import { loadLatestNotebook, loadPreferences } from '@/lib/storage/notebook-db';
import { selectIsDark, useSketchStore } from '@/lib/store/sketch-store';
import { CanvasBar } from './CanvasBar';
import { DrawingSurface } from './DrawingSurface';
import { PropertiesPanel } from './PropertiesPanel';
import { ToolBar } from './ToolBar';
import { TopBar } from './TopBar';

const LOAD_ERROR = 'Your saved notebooks could not be opened. This session will not be saved until storage is available.';

export function SketchPadApp() {
  const ready = useSketchStore((state) => state.ready);
  const isDark = useSketchStore(selectIsDark);
  const flushSave = useAutosave(ready);

  const handleSave = useCallback(() => void flushSave(), [flushSave]);
  const handleExportPage = useCallback(() => {
    exportCurrentDrawing().catch((error: unknown) =>
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    );
  }, []);
  useKeyboardShortcuts({ onSave: handleSave, onExportPage: handleExportPage });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [doc, preferences] = await Promise.all([loadLatestNotebook(), loadPreferences()]);
        if (cancelled) return;
        useSketchStore.getState().load(doc ?? createNotebook(), preferences ?? DEFAULT_PREFERENCES);
      } catch {
        if (cancelled) return;
        useSketchStore.getState().load(createNotebook(), DEFAULT_PREFERENCES);
        useSketchStore.getState().setSaveStatus('error', LOAD_ERROR);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => useSketchStore.getState().setSystemDark(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  if (!ready) {
    return (
      <main className="flex h-dvh items-center justify-center bg-background text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-label="Opening your notebook" />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      <DrawingSurface />
      <TopBar />
      <ToolBar />
      <PropertiesPanel />
      <CanvasBar />
      <Toaster />
    </main>
  );
}
