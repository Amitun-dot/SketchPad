import { useCallback, useEffect, useRef } from 'react';
import { selectNotebookDoc, useSketchStore } from '@/lib/store/sketch-store';
import { saveNotebook, savePreferences } from '@/lib/storage/notebook-db';

const SAVE_DELAY_MS = 700;
const SAVE_ERROR = 'Your latest changes could not be saved. Check that this browser allows site storage.';
const PREFERENCES_ERROR = 'Your preferences could not be saved in this browser.';

/**
 * Persists the notebook and preferences to IndexedDB. Saves are throttled so long
 * drawing sessions still save periodically. Returns a function that saves immediately.
 */
export function useAutosave(enabled: boolean): () => Promise<void> {
  const flushRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!enabled) return;
    const store = useSketchStore;
    let dirty = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = async () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (!dirty) return;
      dirty = false;
      store.getState().setSaveStatus('saving');
      try {
        await saveNotebook(selectNotebookDoc(store.getState()));
        if (!dirty) store.getState().setSaveStatus('saved');
      } catch {
        dirty = true;
        store.getState().setSaveStatus('error', SAVE_ERROR);
      }
    };

    const schedule = () => {
      dirty = true;
      store.getState().setSaveStatus('unsaved');
      timer ??= setTimeout(() => void flush(), SAVE_DELAY_MS);
    };

    flushRef.current = flush;

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.pages !== previous.pages || state.notebookName !== previous.notebookName) {
        schedule();
      }
      if (state.preferences !== previous.preferences) {
        savePreferences(state.preferences).catch(() =>
          store.getState().setSaveStatus('error', PREFERENCES_ERROR)
        );
      }
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    const handlePageHide = () => {
      if (dirty) void flush();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      if (timer !== null) clearTimeout(timer);
      flushRef.current = async () => {};
    };
  }, [enabled]);

  return useCallback(() => flushRef.current(), []);
}
