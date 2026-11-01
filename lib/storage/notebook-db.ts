import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { notebookSchema, preferencesSchema, type NotebookDoc, type Preferences } from '@/lib/sketch/types';

interface SketchPadDB extends DBSchema {
  notebooks: { key: string; value: NotebookDoc };
  preferences: { key: string; value: Preferences };
}

const DB_NAME = 'sketchpad';
const PREFERENCES_KEY = 'current';

let dbPromise: Promise<IDBPDatabase<SketchPadDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SketchPadDB>> {
  dbPromise ??= openDB<SketchPadDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('notebooks', { keyPath: 'id' });
      db.createObjectStore('preferences');
    },
  });
  return dbPromise;
}

/** Returns the most recently updated notebook that passes validation; corrupt records are skipped, never overwritten. */
export async function loadLatestNotebook(): Promise<NotebookDoc | null> {
  const db = await getDb();
  const records = await db.getAll('notebooks');
  const valid = records.flatMap((record) => {
    const parsed = notebookSchema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
  valid.sort((a, b) => b.updatedAt - a.updatedAt);
  return valid[0] ?? null;
}

export async function saveNotebook(doc: NotebookDoc): Promise<void> {
  const db = await getDb();
  await db.put('notebooks', doc);
}

/** Replaces every stored notebook with the given one; used when the user confirms an import. */
export async function replaceNotebook(doc: NotebookDoc): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('notebooks', 'readwrite');
  await tx.store.clear();
  await tx.store.put(doc);
  await tx.done;
}

export async function loadPreferences(): Promise<Preferences | null> {
  const db = await getDb();
  const record = await db.get('preferences', PREFERENCES_KEY);
  const parsed = preferencesSchema.safeParse(record);
  return parsed.success ? parsed.data : null;
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  const db = await getDb();
  await db.put('preferences', preferences, PREFERENCES_KEY);
}
