import type { CSSProperties } from 'react';
import { ICON } from './ui/icons';
import type { IconName } from './ui/icons';

type Props = {
  /** A name from the icon set, or a raw path on the same 24×24 grid. */
  name?: IconName;
  d?: string;
  size?: number;
  stroke?: string;
  width?: number;
  style?: CSSProperties;
  className?: string;
};

export function Icon({ name, d, size = 16, stroke = 'currentColor', width = 1.6, style, className }: Props) {
  const path = d ?? (name ? ICON[name] : '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
