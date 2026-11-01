'use client';

import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { COLOR_THEMES } from '@/lib/sketch/themes';
import { COLOR_THEME_IDS, type ColorThemeId, type ThemeMode } from '@/lib/sketch/types';
import { useSketchStore } from '@/lib/store/sketch-store';
import { cn } from '@/lib/utils';

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Ctrl/Cmd + Z', action: 'Undo' },
  { keys: 'Ctrl/Cmd + Shift + Z', action: 'Redo' },
  { keys: 'Ctrl/Cmd + S', action: 'Save now' },
  { keys: 'Ctrl/Cmd + E', action: 'Export current page as PNG' },
  { keys: 'P / D / H', action: 'Pen, pencil, highlighter' },
  { keys: 'E / G', action: 'Eraser, hand tool' },
  { keys: 'Space + drag', action: 'Pan the page' },
  { keys: '+ / -', action: 'Zoom in and out' },
  { keys: '0', action: 'Fit page to screen' },
  { keys: 'Escape', action: 'Return to the pen' },
];

const MODE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const themeMode = useSketchStore((state) => state.preferences.theme);
  const colorTheme = useSketchStore((state) => state.preferences.colorTheme);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Your notebooks are saved automatically in this browser. Nothing is uploaded or shared.
          </DialogDescription>
        </DialogHeader>

        <section className="mt-2 space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Appearance</h3>
          <div role="radiogroup" aria-label="Appearance mode" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {MODE_OPTIONS.map((option) => {
              const active = option.value === themeMode;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => useSketchStore.getState().setThemeMode(option.value)}
                  className={cn(
                    'h-8 rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-2 gap-2">
            {COLOR_THEME_IDS.map((id: ColorThemeId) => {
              const theme = COLOR_THEMES[id];
              const active = id === colorTheme;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => useSketchStore.getState().setColorTheme(id)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-foreground/60 bg-accent' : 'border-border'
                  )}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/10"
                    style={{ backgroundColor: theme.swatch }}
                    aria-hidden="true"
                  >
                    {active && <Check className="h-3 w-3 text-foreground" strokeWidth={2.5} />}
                  </span>
                  <span className="truncate">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Keyboard shortcuts
          </h3>
          <ul className="divide-y divide-border/70">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.keys} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">{shortcut.action}</span>
                <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                  {shortcut.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
