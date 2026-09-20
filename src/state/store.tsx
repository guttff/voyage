import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { loadData, loadImages, putImage, deleteImage, replaceImages, saveData } from '../lib/storage';
import type { AppData, Option, Person, Vacation } from '../lib/types';

type Updater<T> = (prev: T) => T;

export type Store = {
  data: AppData;
  images: Record<string, string>;
  imagesReady: boolean;

  /** The person whose name is stamped on anything added right now. */
  me: Person;
  setUser: (id: string) => void;
  setPerson: (id: string, patch: Partial<Person>) => void;

  setData: (u: Updater<AppData>) => void;
  replaceData: (d: AppData) => void;

  updVac: (vacId: string, fn: Updater<Vacation>) => void;
  updOpt: (vacId: string, optId: string, fn: Updater<Option>) => void;
  log: (text: string) => void;

  setImage: (id: string, dataUrl: string) => void;
  clearImage: (id: string) => void;
  restoreImages: (images: Record<string, string>) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataRaw] = useState<AppData>(() => loadData());
  const [images, setImages] = useState<Record<string, string>>({});
  const [imagesReady, setImagesReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    let live = true;
    loadImages().then((m) => {
      if (!live) return;
      setImages(m);
      setImagesReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  // Skip the write on mount: nothing has changed yet, and re-serialising the
  // whole model on load is pure cost.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveData(data);
  }, [data]);

  const setData = useCallback((u: Updater<AppData>) => setDataRaw(u), []);

  const replaceData = useCallback((d: AppData) => {
    setDataRaw(d);
    saveData(d);
  }, []);

  const log = useCallback(
    (text: string) =>
      setDataRaw((s) => ({ ...s, activity: [{ t: Date.now(), text }, ...s.activity].slice(0, 12) })),
    [],
  );

  const updVac = useCallback(
    (vacId: string, fn: Updater<Vacation>) =>
      setDataRaw((s) => ({ ...s, vacations: s.vacations.map((v) => (v.id === vacId ? fn(v) : v)) })),
    [],
  );

  const updOpt = useCallback(
    (vacId: string, optId: string, fn: Updater<Option>) =>
      updVac(vacId, (v) => ({ ...v, options: v.options.map((o) => (o.id === optId ? fn(o) : o)) })),
    [updVac],
  );

  const setUser = useCallback((id: string) => setDataRaw((s) => ({ ...s, user: id })), []);

  const setPerson = useCallback(
    (id: string, patch: Partial<Person>) =>
      setDataRaw((s) => {
        const people = s.people.map((p) => (p.id === id ? { ...p, ...patch } : p));
        if (patch.name === undefined) return { ...s, people };
        // An option carries its owner's name for display, so renaming a
        // traveler has to follow through into every plan they own.
        const vacations = s.vacations.map((v) => ({
          ...v,
          options: v.options.map((o) => (o.personId === id ? { ...o, author: patch.name! } : o)),
        }));
        return { ...s, people, vacations };
      }),
    [],
  );

  const setImage = useCallback((id: string, dataUrl: string) => {
    setImages((m) => ({ ...m, [id]: dataUrl }));
    void putImage(id, dataUrl);
  }, []);

  const clearImage = useCallback((id: string) => {
    setImages((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    void deleteImage(id);
  }, []);

  const restoreImages = useCallback((next: Record<string, string>) => {
    setImages(next);
    void replaceImages(next);
  }, []);

  const me = data.people.find((p) => p.id === data.user) || data.people[0];

  const value = useMemo<Store>(
    () => ({
      data,
      images,
      imagesReady,
      me,
      setUser,
      setPerson,
      setData,
      replaceData,
      updVac,
      updOpt,
      log,
      setImage,
      clearImage,
      restoreImages,
    }),
    [
      data,
      images,
      imagesReady,
      me,
      setUser,
      setPerson,
      setData,
      replaceData,
      updVac,
      updOpt,
      log,
      setImage,
      clearImage,
      restoreImages,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}
