
'use client';

import {
  Eraser,
  Hand,
  Highlighter,
  PenLine,
  Pencil,
  Shapes,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { useThemeTone } from '@/hooks/use-theme-tone';
import { useSketchStore } from '@/lib/store/sketch-store';
import type { ToolId } from '@/lib/sketch/types';
import { cn } from '@/lib/utils';

const TOOLS: {
  id: ToolId;
  label: string;
  shortcut: string;
  icon: LucideIcon;
}[] = [
  { id: 'pen', label: 'Pen', shortcut: 'P', icon: PenLine },
  { id: 'pencil', label: 'Pencil', shortcut: 'D', icon: Pencil },
  { id: 'highlighter', label: 'Highlighter', shortcut: 'H', icon: Highlighter },
  { id: 'shapes', label: 'Shapes', shortcut: 'S', icon: Shapes },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser },
  { id: 'hand', label: 'Hand (pan)', shortcut: 'G', icon: Hand },
  { id: 'text', label: 'Text', shortcut: 'T', icon: Type },
];

export function ToolBar() {
  const tool = useSketchStore((state) => state.tool);
  const setTool = useSketchStore((state) => state.setTool);
  const tone = useThemeTone();

  return (
    <nav
      aria-label="Drawing tools"
      className="pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-4"
    >
      <div className="pointer-events-auto flex flex-col gap-1 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {TOOLS.map(({ id, label, shortcut, icon: Icon }) => {
          const active = tool === id;

          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={active}
              title={`${label} (${shortcut})`}
              onClick={() => setTool(id)}
              style={
                active
                  ? {
                      backgroundColor: tone.accent,
                      color: tone.accentForeground,
                    }
                  : undefined
              }
              className={cn(
                'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
