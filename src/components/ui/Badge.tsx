import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from './icons';

export type Tone = 'good' | 'warn' | 'critical' | 'neutral' | 'accent';

/** Status colour never carries the message alone — a badge always has a label,
    and the tones that fail contrast as a mark also get an icon. */
const DEFAULT_ICON: Partial<Record<Tone, IconName>> = {
  good: 'checkCircle',
  warn: 'alert',
  critical: 'alert',
};

export function Badge({
  tone = 'neutral',
  children,
  icon,
  small,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: IconName | null;
  small?: boolean;
}) {
  const name = icon === null ? undefined : (icon ?? DEFAULT_ICON[tone]);
  return (
    <span className={`badge badge-${tone}${small ? ' badge-sm' : ''}`}>
      {name && <Icon name={name} size={small ? 11 : 13} />}
      {children}
    </span>
  );
}
