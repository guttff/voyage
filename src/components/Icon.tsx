import type { CSSProperties } from 'react';

type Props = {
  /** An SVG path on the shared 24×24 grid — see CATS / NAV_ICONS. */
  d: string;
  size?: number;
  stroke?: string;
  style?: CSSProperties;
};

export function Icon({ d, size = 16, stroke = 'currentColor', style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
