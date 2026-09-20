import { useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { useStore } from '../state/store';
import { readImageFile } from '../lib/storage';
import { Icon } from './Icon';

type Props = {
  /** Stable key for the photo — `cover-<vacId>`, `avatar-<personId>`, … */
  id: string;
  shape?: 'rect' | 'circle';
  placeholder?: string;
  /** Renders the empty prompt for a dark plate (hero, card cover). */
  onDark?: boolean;
  style?: CSSProperties;
  className?: string;
};

/**
 * The user-fillable photo slot. The design prototype's custom element persisted
 * drops into a sidecar file owned by the design tool; here a drop is downscaled
 * and kept in IndexedDB, and the store shares it with every slot carrying the
 * same id — a cover is one photo, the rail avatar and the plan-card avatar are
 * the same photo.
 */
export function ImageSlot({ id, shape = 'rect', placeholder = 'Add a photo', onDark, style, className }: Props) {
  const { images, setImage, clearImage } = useStore();
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const src = images[id];

  const accept = async (file: File | undefined) => {
    setOver(false);
    if (!file) return;
    try {
      setImage(id, await readImageFile(file));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    void accept(e.dataTransfer.files?.[0]);
  };

  const cls = ['slot', shape === 'circle' ? 'slot-circle' : '', onDark ? 'slot-onDark' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      style={style}
      data-filled={src ? '' : undefined}
      data-over={over ? '' : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          input.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={src ? `Replace photo: ${placeholder}` : placeholder}
      title={src ? 'Click or drop a file to replace' : 'Click to choose a photo, or drop one here'}
    >
      {src && <img src={src} alt="" draggable={false} />}
      {placeholder !== '' && (
        <span className="slot-empty">
          <Icon name="image" size={18} />
          <span>{error || placeholder}</span>
        </span>
      )}
      {src && (
        <button
          type="button"
          className="slot-clear"
          title="Remove photo"
          aria-label="Remove photo"
          onClick={(e) => {
            e.stopPropagation();
            clearImage(id);
          }}
        >
          <Icon name="x" size={13} />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          void accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
