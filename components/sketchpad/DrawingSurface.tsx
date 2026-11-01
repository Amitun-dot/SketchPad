
'use client';

import { useEffect, useRef, useState } from 'react';

import { selectCurrentPage, useSketchStore } from '@/lib/store/sketch-store';
import { useThemeTone } from '@/hooks/use-theme-tone';
import { InputController, type InputHooks } from '@/lib/sketch/input-controller';
import { SketchRenderer } from '@/lib/sketch/renderer';
import { createId } from '@/lib/sketch/defaults';
import type { TextObject } from '@/lib/sketch/types';
import { cn } from '@/lib/utils';

interface TextEditorState {
  id?: string;
  x: number;
  y: number;
  value: string;
  color: string;
  fontSize: number;
}

export function DrawingSurface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SketchRenderer | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<TextEditorState | null>(null);

  const [editor, setEditor] = useState<TextEditorState | null>(null);

  const page = useSketchStore(selectCurrentPage);
  const view = useSketchStore((state) => state.view);
  const tool = useSketchStore((state) => state.tool);
  const panHeld = useSketchStore((state) => state.panHeld);

  const deskColor = useThemeTone().desk;

  // Keep the ref synchronized immediately, even before React rerenders.
  const changeEditor = (next: TextEditorState | null) => {
    editorRef.current = next;
    setEditor(next);
  };

  const saveEditor = () => {
    const current = editorRef.current;
    if (!current) return;

    // Close the editor first so blur cannot save it twice.
    editorRef.current = null;
    setEditor(null);

    const value = current.value.trim();

    const store = useSketchStore.getState();

    if (!value) {
      if (current.id) store.removeText(current.id);
      return;
    }

    if (current.id) {
      store.updateText(current.id, {
        x: current.x,
        y: current.y,
        text: value,
        color: current.color,
        fontSize: current.fontSize,
      });
    } else {
      const textObject: TextObject = {
        id: createId(),
        x: current.x,
        y: current.y,
        text: value,
        color: current.color,
        fontSize: current.fontSize,
      };

      store.appendText(textObject);
    }
  };

  const openTextEditor = (point: [number, number]) => {
    // Save any previous editor before opening another one.
    saveEditor();

    const state = useSketchStore.getState();
    const currentPage = state.pages.find(
      (item) => item.id === state.currentPageId
    );

    const existingText = currentPage?.texts?.find((item) => {
      const lines = item.text.split('\n');

      const width = Math.max(
        item.fontSize,
        ...lines.map((line) => line.length * item.fontSize * 0.62)
      );

      const height = lines.length * item.fontSize * 1.2;

      return (
        point[0] >= item.x - 5 &&
        point[0] <= item.x + width + 5 &&
        point[1] >= item.y - 5 &&
        point[1] <= item.y + height + 5
      );
    });

    if (existingText) {
      changeEditor({
        id: existingText.id,
        x: existingText.x,
        y: existingText.y,
        value: existingText.text,
        color: existingText.color,
        fontSize: existingText.fontSize,
      });
      return;
    }

    changeEditor({
      x: point[0],
      y: point[1],
      value: '',
      color: state.preferences.styles.pen.color,
      fontSize: state.preferences.styles.pen.size,
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    const base = baseRef.current;
    const active = activeRef.current;

    if (!container || !base || !active) return;

    const renderer = new SketchRenderer();

    renderer.attach(base, active);
    rendererRef.current = renderer;

    const hooks: InputHooks = {
      read: () => {
        const state = useSketchStore.getState();

        return {
          tool: state.tool,
          view: state.view,
          panHeld: state.panHeld,
          preferences: state.preferences,
        };
      },

      setView: (patch) =>
        useSketchStore.getState().setView(patch),

      commitStroke: (stroke) =>
        useSketchStore.getState().appendStroke(stroke),

      commitShape: (shape) =>
        useSketchStore.getState().appendShape(shape),

      startText: (point) => openTextEditor(point),

      findTextAt: (point) => {
        const state = useSketchStore.getState();
        const currentPage = state.pages.find(
          (item) => item.id === state.currentPageId
        );

        if (!currentPage) return null;

        // Search from the topmost text object backwards.
        const texts = [...(currentPage.texts ?? [])].reverse();

        return (
          texts.find((item) => {
            const lines = item.text.split('\n');

            const width = Math.max(
              item.fontSize,
              ...lines.map((line) => line.length * item.fontSize * 0.62)
            );

            const height = lines.length * item.fontSize * 1.2;

            return (
              point[0] >= item.x - 6 &&
              point[0] <= item.x + width + 6 &&
              point[1] >= item.y - 6 &&
              point[1] <= item.y + height + 6
            );
          }) ?? null
        );
      },

      moveText: (id, x, y) =>
        useSketchStore.getState().moveText(id, x, y),

      beginEdit: () =>
        useSketchStore.getState().beginEdit(),

      endEdit: () =>
        useSketchStore.getState().endEdit(),

      eraseSegment: (from, to, radius) =>
        useSketchStore.getState().eraseSegment(from, to, radius),
    };

    const controller = new InputController(active, renderer, hooks);
    const detach = controller.attach();

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      renderer.resize(
        width,
        height,
        window.devicePixelRatio || 1
      );

      useSketchStore.getState().setViewport(width, height);
    });

    observer.observe(container);

    return () => {
      saveEditor();
      observer.disconnect();
      detach();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setScene({
      page,
      view,
      deskColor,
    });
  }, [page, view, deskColor]);

  useEffect(() => {
    if (!editor) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.setSelectionRange(
      textarea.value.length,
      textarea.value.length
    );

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editor?.id, editor?.x, editor?.y]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editor?.value]);

  const cursor =
    panHeld || tool === 'hand'
      ? 'cursor-grab'
      : tool === 'eraser'
        ? 'cursor-none'
        : tool === 'text'
          ? 'cursor-text'
          : 'cursor-crosshair';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: deskColor }}
    >
      <canvas
        ref={baseRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <canvas
        ref={activeRef}
        aria-label="Drawing area"
        role="img"
        className={cn(
          'absolute inset-0 h-full w-full touch-none select-none',
          cursor
        )}
      />

      {editor && (
        <textarea
          ref={textareaRef}
          value={editor.value}
          placeholder="Type something..."
          spellCheck={false}
          rows={1}
          onChange={(event) => {
            const current = editorRef.current;
            if (!current) return;

            changeEditor({
              ...current,
              value: event.target.value,
            });
          }}
          onBlur={() => saveEditor()}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              changeEditor(null);
              return;
            }

            if (event.key === 'Enter' && event.ctrlKey) {
              event.preventDefault();
              saveEditor();
            }
          }}
          className="absolute z-20 min-h-8 min-w-40 resize-none overflow-hidden border border-dashed border-blue-400 bg-transparent p-1 outline-none"
          style={{
            left: editor.x * view.zoom + view.panX,
            top: editor.y * view.zoom + view.panY,
            fontSize: `${editor.fontSize * view.zoom}px`,
            lineHeight: 1.2,
            color: editor.color,
            width: `${Math.max(200, 320 * view.zoom)}px`,
            fontFamily: 'Arial, sans-serif',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}
        />
      )}
    </div>
  );
}
