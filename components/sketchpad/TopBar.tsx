
'use client';

import { useState } from 'react';
import { Monitor, Moon, Redo2, Settings, Sun, Undo2 } from 'lucide-react';
import { useSketchStore } from '@/lib/store/sketch-store';
import type { ThemeMode } from '@/lib/sketch/types';
import { BrandMark } from './BrandMark';
import { ExportMenu } from './ExportMenu';
import { IconButton } from './IconButton';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SettingsDialog } from './SettingsDialog';

const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const THEME_ICONS: Record<ThemeMode, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export function TopBar() {
  const notebookName = useSketchStore((state) => state.notebookName);
  const canUndo = useSketchStore((state) => state.past.length > 0);
  const canRedo = useSketchStore((state) => state.future.length > 0);
  const theme = useSketchStore((state) => state.preferences.theme);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ThemeIcon = THEME_ICONS[theme];

  return (
    <>
      {/* Standalone wordmark on large screens */}
      <div className="pointer-events-none fixed left-8 top-5 z-50 hidden xl:block">
        <BrandMark showWordmark />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-2 pt-2 sm:px-4 sm:pt-4">
        <div className="pointer-events-auto flex w-full max-w-4xl min-w-0 items-center gap-1 rounded-xl border border-border bg-card px-1.5 py-1.5 shadow-sm sm:gap-1.5 sm:px-2.5">

          {/* Compact wordmark on tablet and mobile */}
          <div className="shrink-0 xl:hidden">
            <BrandMark showWordmark />
          </div>

          <input
            aria-label="Notebook name"
            value={notebookName}
            maxLength={120}
            onChange={(event) =>
              useSketchStore.getState().setNotebookName(event.target.value)
            }
            onBlur={(event) => {
              if (!event.target.value.trim()) {
                useSketchStore.getState().setNotebookName('Untitled notebook');
              }
            }}
            className="hidden min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm font-medium outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring xl:block"
          />

          <SaveStatusIndicator />

          <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" />

          <IconButton
            label="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={() => useSketchStore.getState().undo()}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </IconButton>

          <IconButton
            label="Redo (Ctrl+Shift+Z)"
            disabled={!canRedo}
            onClick={() => useSketchStore.getState().redo()}
          >
            <Redo2 className="h-4 w-4" aria-hidden="true" />
          </IconButton>

          <ExportMenu />

          <IconButton
            label={`Theme: ${THEME_LABELS[theme]}. Switch theme`}
            onClick={() =>
              useSketchStore.getState().setThemeMode(NEXT_THEME[theme])
            }
          >
            <ThemeIcon className="h-4 w-4" aria-hidden="true" />
          </IconButton>

          <IconButton
            label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      </header>
    </>
  );
}
