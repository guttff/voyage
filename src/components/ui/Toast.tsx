import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from './icons';

type Tone = 'info' | 'good' | 'critical';
type Toast = { id: number; text: string; tone: Tone };

const ICONS: Record<Tone, IconName> = { info: 'info', good: 'checkCircle', critical: 'alert' };

const Ctx = createContext<((text: string, tone?: Tone) => void) | null>(null);

/** Confirms actions that would otherwise change something off-screen — a copy
    into another plan, an import, a delete. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const push = useCallback((text: string, tone: Tone = 'info') => {
    const id = next.current++;
    setToasts((t) => [...t, { id, text, tone }].slice(-4));
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon
              name={ICONS[t.tone]}
              size={15}
              stroke={t.tone === 'good' ? 'var(--good-text)' : t.tone === 'critical' ? 'var(--critical-text)' : 'var(--accent-700)'}
            />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const t = useContext(Ctx);
  if (!t) throw new Error('useToast must be used inside <ToastProvider>');
  return t;
}
