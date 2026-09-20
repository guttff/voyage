import type { CSSProperties } from 'react';

/**
 * The four registration marks that sit just outside a `.blueprint` box. The DS
 * draws them from `.blueprint > .corner`, so they must stay direct children.
 */
export function Corners({ style }: { style?: CSSProperties }) {
  return (
    <>
      <i className="corner tl" style={style} />
      <i className="corner tr" style={style} />
      <i className="corner bl" style={style} />
      <i className="corner br" style={style} />
    </>
  );
}
