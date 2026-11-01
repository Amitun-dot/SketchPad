
'use client';

import { useEffect, useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

import { IconButton } from './IconButton';
import { HandwritingControls } from './HandwritingControls';
import { InkStyleControls } from './InkStyleControls';
import { PanelSection, SliderField } from './PanelControls';

import { useSketchStore } from '@/lib/store/sketch-store';
import type { ToolId } from '@/lib/sketch/types';

const TOOL_TITLES: Record<ToolId, string> = {
  pen: 'Pen',
  pencil: 'Pencil',
  highlighter: 'Highlighter',
  shapes: 'Shapes',
  eraser: 'Eraser',
  hand: 'Hand',
  text: 'Text',
};

const COMPACT_QUERY = '(max-width: 1023px)';

const TEXT_COLORS = [
  '#111827',
  '#FFFFFF',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

const SHAPE_COLORS = [
  '#1C1C1E',
  '#FFFFFF',
  '#E5484D',
  '#F97316',
  '#EAB308',
  '#16A34A',
  '#06B6D4',
  '#2563EB',
  '#9333EA',
  '#EC4899',
  '#8B5E3C',
  '#8E8E93',
];

export function PropertiesPanel() {
  const tool = useSketchStore((state) => state.tool);

  const eraserSize = useSketchStore(
    (state) => state.preferences.eraserSize
  );

  const setEraserSize = useSketchStore(
    (state) => state.setEraserSize
  );

  const textStyle = useSketchStore(
    (state) => state.preferences.styles.pen
  );

  const updateToolStyle = useSketchStore(
    (state) => state.updateToolStyle
  );

  const shapeStyle = useSketchStore(
    (state) => state.preferences.styles.shapes
  );

  const updateShapeStyle = useSketchStore(
    (state) => state.updateShapeStyle
  );

  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.matchMedia(COMPACT_QUERY).matches) {
      setOpen(false);
    }
  }, []);

  if (!open) {
    return (
      <div className="pointer-events-none absolute right-3 top-20 z-20 sm:right-4">
        <div className="pointer-events-auto rounded-xl border border-border bg-card p-1.5 shadow-sm">
          <IconButton
            label="Show properties"
            onClick={() => setOpen(true)}
          >
            <PanelRightOpen
              className="h-4 w-4"
              aria-hidden="true"
            />
          </IconButton>
        </div>
      </div>
    );
  }

  const isInk =
    tool === 'pen' ||
    tool === 'pencil' ||
    tool === 'highlighter';

  return (
    <aside
      aria-label="Tool properties"
      className="pointer-events-none absolute bottom-24 right-3 top-20 z-20 flex w-[min(18rem,calc(100vw-6rem))] flex-col sm:right-4 sm:bottom-28"
    >
      <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <header className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <h2 className="text-sm font-semibold">
            {TOOL_TITLES[tool]}
          </h2>

          <IconButton
            label="Hide properties"
            className="h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <PanelRightClose
              className="h-4 w-4"
              aria-hidden="true"
            />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          {isInk && (
            <>
              <InkStyleControls tool={tool} />
              <HandwritingControls />
            </>
          )}

          {tool === 'shapes' && (
            <PanelSection title="Shape style">
              {/* Shape color */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="shape-color"
                    className="text-sm font-medium"
                  >
                    Color
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {shapeStyle.color.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SHAPE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Select ${color} shape color`}
                      aria-pressed={shapeStyle.color === color}
                      onClick={() => updateShapeStyle({ color })}
                      className={`h-7 w-7 rounded-full border ${
                        shapeStyle.color === color
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="shape-color"
                    type="color"
                    value={shapeStyle.color}
                    onChange={(event) =>
                      updateShapeStyle({
                        color: event.target.value,
                      })
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
                  />

                  <span className="text-xs text-muted-foreground">
                    Custom color
                  </span>
                </div>
              </div>

              {/* Shape thickness */}
              <div className="mt-5">
                <SliderField
                  label="Border thickness"
                  value={shapeStyle.size}
                  display={`${shapeStyle.size.toFixed(1)} px`}
                  min={0.5}
                  max={24}
                  step={0.5}
                  onChange={(size) =>
                    updateShapeStyle({ size })
                  }
                />
              </div>

              {/* Shape opacity */}
              <div className="mt-5">
                <SliderField
                  label="Opacity"
                  value={shapeStyle.opacity}
                  display={`${Math.round(shapeStyle.opacity * 100)}%`}
                  min={0.05}
                  max={1}
                  step={0.05}
                  onChange={(opacity) =>
                    updateShapeStyle({ opacity })
                  }
                />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Draw circles, rectangles, triangles, lines and arrows.
                Your shape settings are independent of Pen and Pencil.
              </p>
            </PanelSection>
          )}

          {tool === 'text' && (
            <PanelSection title="Text style">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="text-color"
                    className="text-sm font-medium"
                  >
                    Text color
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {textStyle.color}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Select ${color} text color`}
                      aria-pressed={textStyle.color === color}
                      onClick={() =>
                        updateToolStyle('pen', { color })
                      }
                      className={`h-7 w-7 rounded-full border ${
                        textStyle.color === color
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="text-color"
                    type="color"
                    value={textStyle.color}
                    onChange={(event) =>
                      updateToolStyle('pen', {
                        color: event.target.value,
                      })
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
                  />

                  <span className="text-xs text-muted-foreground">
                    Custom color
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <SliderField
                  label="Font size"
                  value={Math.min(96, Math.max(12, textStyle.size))}
                  display={`${Math.round(textStyle.size)} px`}
                  min={12}
                  max={96}
                  step={1}
                  onChange={(size) =>
                    updateToolStyle('pen', { size })
                  }
                />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Click anywhere on the canvas to add text. Click existing
                text to edit it. Press Ctrl + Enter to save.
              </p>
            </PanelSection>
          )}

          {tool === 'eraser' && (
            <PanelSection title="Eraser">
              <SliderField
                label="Size"
                value={eraserSize}
                display={`${Math.round(eraserSize)} px`}
                min={4}
                max={120}
                step={1}
                onChange={setEraserSize}
              />

              <p className="text-xs leading-relaxed text-muted-foreground">
                Drag over ink, shapes or text to remove them.
                Shapes are removed as complete objects.
              </p>
            </PanelSection>
          )}

          {tool === 'hand' && (
            <PanelSection title="Navigate">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Drag to move around the page. Hold Space with any tool to
                pan, and use the mouse wheel to zoom.
              </p>
            </PanelSection>
          )}
        </div>
      </div>
    </aside>
  );
}
