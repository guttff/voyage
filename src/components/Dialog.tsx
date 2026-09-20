import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
};

/** Modal shell: backdrop click or Escape dismisses; focus starts inside. */
export function Dialog({ title, description, onClose, children, footer }: Props) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const first = box.current?.querySelector<HTMLElement>('input, select, textarea, button');
    first?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} ref={box}>
        <div className="dialog-hd">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="dialog-bd">{children}</div>
        <div className="dialog-ft">{footer}</div>
      </div>
    </div>
  );
}
