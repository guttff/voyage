import { ImageSlot } from './ImageSlot';

type Props = {
  personId?: string;
  initial: string;
  size: number;
};

/**
 * Initial on an accent disc, with the traveler's photo layered over it when
 * one has been set. Read-only here — photos are set on the Settings page.
 */
export function Avatar({ personId, initial, size }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--color-accent-600)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
        fontSize: Math.round(size * 0.44),
        color: 'var(--color-bg)',
      }}
    >
      <span>{initial}</span>
      {personId && (
        <div className="vy-av" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <ImageSlot id={`avatar-${personId}`} shape="circle" placeholder="" />
        </div>
      )}
    </div>
  );
}
