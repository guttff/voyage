import { ImageSlot } from './ImageSlot';

/**
 * Initial on an accent disc, with the traveler's photo layered over it when one
 * has been set. Read-only here — photos are set on the Settings page.
 */
export function Avatar({ personId, initial, size }: { personId?: string; initial: string; size: number }) {
  return (
    <span className="av" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
      {initial}
      {personId && (
        <span className="av-photo">
          <ImageSlot id={`avatar-${personId}`} shape="circle" placeholder="" />
        </span>
      )}
    </span>
  );
}
