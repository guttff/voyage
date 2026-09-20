import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CatKey, Confirm, Page, Route, TripTab } from '../lib/types';

export type Panel =
  | { kind: 'add'; optId: string; editId: string | null; date?: string }
  | { kind: 'copy'; optId: string; itemId: string }
  | { kind: 'newvac' }
  | { kind: 'confirm'; confirm: Confirm; tone?: 'danger' }
  | null;

export type ImportMode = 'new' | string;

export type Ui = {
  route: Route;
  go: (page: Page) => void;
  openTrip: (vacId: string, tab?: TripTab, optId?: string | null) => void;
  setTab: (tab: TripTab) => void;
  /** Back to Home on a fresh data set (restore / reset). */
  resetRoute: (vacId?: string) => void;

  /** Which plan the Itinerary / Add-item flows are pointed at. */
  activeOptId: string | null;
  setActiveOpt: (id: string | null) => void;

  panel: Panel;
  openPanel: (p: Panel) => void;
  closePanel: () => void;

  /** Last category picked in the Add item form, so the next one starts there. */
  lastCat: CatKey;
  setLastCat: (c: CatKey) => void;

  importText: string;
  setImportText: (t: string) => void;
  importMode: ImportMode;
  setImportMode: (m: ImportMode) => void;
  importFileName: string;
  setImportFileName: (n: string) => void;
  exportOptId: string;
  setExportOptId: (id: string) => void;
};

export const IMPORT_HINT = 'or drag it onto the text box';

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ firstVacId, children }: { firstVacId?: string; children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ page: 'home', vacId: firstVacId, tab: 'plans' });
  const [activeOptId, setActiveOpt] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [lastCat, setLastCat] = useState<CatKey>('flight');
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('new');
  const [importFileName, setImportFileName] = useState(IMPORT_HINT);
  const [exportOptId, setExportOptId] = useState('final');

  const go = useCallback((page: Page) => {
    setRoute((r) => ({ ...r, page }));
    setPanel(null);
  }, []);

  const openTrip = useCallback((vacId: string, tab: TripTab = 'plans', optId: string | null = null) => {
    setRoute({ page: 'trip', vacId, tab });
    setActiveOpt(optId);
    setPanel(null);
  }, []);

  const setTab = useCallback((tab: TripTab) => setRoute((r) => ({ ...r, tab })), []);

  const resetRoute = useCallback((vacId?: string) => {
    setRoute({ page: 'home', vacId, tab: 'plans' });
    setActiveOpt(null);
    setPanel(null);
  }, []);

  const openPanel = useCallback((p: Panel) => setPanel(p), []);
  const closePanel = useCallback(() => setPanel(null), []);

  const value = useMemo<Ui>(
    () => ({
      route,
      go,
      openTrip,
      setTab,
      resetRoute,
      activeOptId,
      setActiveOpt,
      panel,
      openPanel,
      closePanel,
      lastCat,
      setLastCat,
      importText,
      setImportText,
      importMode,
      setImportMode,
      importFileName,
      setImportFileName,
      exportOptId,
      setExportOptId,
    }),
    [route, go, openTrip, setTab, resetRoute, activeOptId, panel, openPanel, closePanel, lastCat, importText, importMode, importFileName, exportOptId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): Ui {
  const u = useContext(Ctx);
  if (!u) throw new Error('useUi must be used inside <UiProvider>');
  return u;
}
