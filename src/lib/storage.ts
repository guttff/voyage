import { STORAGE_KEY } from './constants';
import { seed } from './seed';
import type { AppData } from './types';

/* ── the data model: small, JSON, localStorage ───────────────────────────── */

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<AppData>;
      if (s && Array.isArray(s.vacations)) {
        const base = seed();
        return {
          people: s.people?.length ? s.people : base.people,
          user: s.user || base.user,
          vacations: s.vacations,
          budget: s.budget || base.budget,
          duotone: s.duotone ?? true,
          activity: s.activity || [],
        };
      }
    }
  } catch {
    /* corrupt or blocked storage — fall through to the sample set */
  }
  return seed();
}

export function saveData(d: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* private mode / quota — the session still works, it just won't persist */
  }
}

/* ── photos: too big for localStorage, so IndexedDB ──────────────────────── */

const DB_NAME = 'voyage.images';
const STORE = 'images';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const t = db.transaction(STORE, mode);
          const req = run(t.objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}

/** Every stored photo, keyed by slot id — the whole set is small enough to hold. */
export async function loadImages(): Promise<Record<string, string>> {
  const db = await openDb();
  if (!db) return {};
  return new Promise((resolve) => {
    const out: Record<string, string> = {};
    try {
      const store = db.transaction(STORE, 'readonly').objectStore(STORE);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return resolve(out);
        if (typeof cur.value === 'string') out[String(cur.key)] = cur.value;
        cur.continue();
      };
      req.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}

export const putImage = (id: string, dataUrl: string) =>
  tx('readwrite', (s) => s.put(dataUrl, id) as unknown as IDBRequest<undefined>);

export const deleteImage = (id: string) =>
  tx('readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>);

export const clearImages = () => tx('readwrite', (s) => s.clear() as unknown as IDBRequest<undefined>);

export async function replaceImages(images: Record<string, string>) {
  await clearImages();
  await Promise.all(Object.entries(images).map(([id, url]) => putImage(id, url)));
}

/* ── reading a picked file ───────────────────────────────────────────────── */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

/**
 * Photos come off a phone at several megapixels; storing them raw would push
 * a handful of covers past the practical IndexedDB budget. Downscale the long
 * edge and re-encode, falling back to the untouched data URL if the browser
 * can't decode the file.
 */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Not an image file'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const raw = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        if (scale === 1 && raw.length < 600_000) return resolve(raw);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(raw);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch {
          resolve(raw);
        }
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}
