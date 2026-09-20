import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Corners } from './Blueprint';

type Props = {
  onClose: () => void;
  children: ReactNode;
};

/** The modal shell: click the backdrop or press Escape to dismiss. */
export function Dialog({ onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
        background: 'color-mix(in srgb,var(--color-neutral-900) 50%,transparent)',
        zIndex: 10,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog blueprint"
        role="dialog"
        aria-modal="true"
        style={{ background: 'var(--color-bg)', width: 'min(560px,100%)', maxHeight: '90vh', overflow: 'auto' }}
      >
        <Corners />
        {children}
      </div>
    </div>
  );
}
