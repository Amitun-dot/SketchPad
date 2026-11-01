'use client';

import type { FocusEvent } from 'react';
import { PALETTES, THICKNESS_RANGE } from '@/lib/sketch/defaults';
import type { InkTool } from '@/lib/sketch/types';
import { useSketchStore } from '@/lib/store/sketch-store';
import { cn } from '@/lib/utils';
import { PanelSection, SliderField } from './PanelControls';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function InkPreview({ tool }: { tool: InkTool }) {
  const style = useSketchStore((state) => state.preferences.styles[tool]);
  return (
    <div className="flex h-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
      <svg viewBox="0 0 200 64" className="h-full w-full" aria-hidden="true">
        <path
          d="M14 40 C 50 12, 88 58, 124 30 S 178 18, 188 34"
          fill="none"
          stroke={style.color}
          strokeWidth={Math.min(style.size, 28)}
          strokeOpacity={style.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function InkStyleControls({ tool }: { tool: InkTool }) {
  const style = useSketchStore((state) => state.preferences.styles[tool]);
  const recentColors = useSketchStore((state) => state.preferences.recentColors);
  const updateToolStyle = useSketchStore((state) => state.updateToolStyle);
  const addRecentColor = useSketchStore((state) => state.addRecentColor);
  const range = THICKNESS_RANGE[tool];

  const chooseColor = (color: string) => {
    updateToolStyle(tool, { color });
    addRecentColor(color);
  };

  const commitHex = (event: FocusEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value.trim();
    const candidate = raw.startsWith('#') ? raw : `#${raw}`;
    if (HEX_PATTERN.test(candidate)) {
      chooseColor(candidate.toLowerCase());
    } else {
      event.currentTarget.value = style.color.toUpperCase();
    }
  };

  return (
    <>
      <PanelSection title="Color">
        <div className="grid grid-cols-6 gap-2">
          {PALETTES[tool].map((swatch) => {
            const selected = style.color.toLowerCase() === swatch.hex.toLowerCase();
            return (
              <button
                key={swatch.hex}
                type="button"
                aria-label={swatch.name}
                aria-pressed={selected}
                title={swatch.name}
                onClick={() => chooseColor(swatch.hex)}
                className={cn(
                  'relative h-8 w-8 rounded-full border border-black/10 shadow-sm transition-transform duration-150 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                )}
                style={{ backgroundColor: swatch.hex }}
              />
            );
          })}
        </div>

        {recentColors.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Recent</span>
            <div className="flex flex-wrap gap-2">
              {recentColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Recent color ${color}`}
                  title={color.toUpperCase()}
                  onClick={() => chooseColor(color)}
                  className="h-6 w-6 rounded-full border border-black/10 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <input
            type="color"
            aria-label="Custom color picker"
            value={style.color}
            onChange={(event) => updateToolStyle(tool, { color: event.target.value })}
            onBlur={() => addRecentColor(style.color)}
            className="h-9 w-9 shrink-0 cursor-pointer appearance-none overflow-hidden rounded-full border border-border bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full"
          />
          <input
            key={style.color}
            aria-label="Hex color"
            defaultValue={style.color.toUpperCase()}
            maxLength={7}
            spellCheck={false}
            onBlur={commitHex}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 font-mono text-sm uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </PanelSection>

      <PanelSection title="Stroke">
        <InkPreview tool={tool} />
        <SliderField
          label="Thickness"
          value={style.size}
          display={`${style.size.toFixed(1)} px`}
          min={range.min}
          max={range.max}
          step={tool === 'highlighter' ? 1 : 0.5}
          onChange={(size) => updateToolStyle(tool, { size })}
        />
        <div className="grid grid-cols-4 gap-1.5">
          {range.presets.map((preset) => {
            const selected = Math.abs(style.size - preset) < 0.01;
            const dot = Math.min(Math.max(preset, 3), 22);
            return (
              <button
                key={preset}
                type="button"
                aria-label={`Thickness ${preset}`}
                aria-pressed={selected}
                onClick={() => updateToolStyle(tool, { size: preset })}
                className={cn(
                  'flex h-9 items-center justify-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected && 'bg-accent'
                )}
              >
                <span className="rounded-full bg-foreground" style={{ width: dot, height: dot }} />
              </button>
            );
          })}
        </div>
        <SliderField
          label="Opacity"
          value={Math.round(style.opacity * 100)}
          display={`${Math.round(style.opacity * 100)}%`}
          min={5}
          max={100}
          step={1}
          onChange={(percent) => updateToolStyle(tool, { opacity: percent / 100 })}
        />
      </PanelSection>
    </>
  );
}
