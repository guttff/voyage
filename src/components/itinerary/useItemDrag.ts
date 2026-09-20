import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export type DropTarget = { date: string; index: number };
export type DayLayout = { date: string; itemIds: string[] };

const START_THRESHOLD = 4;
const EDGE = 72;
const EDGE_SPEED = 14;

/**
 * Drag-to-reorder for the itinerary.
 *
 * Built on pointer events rather than HTML5 drag-and-drop, which does not fire
 * on touch — this app is used on a phone as much as a laptop. Dragging starts
 * from an explicit grip so it never competes with scrolling a day or with the
 * row's own buttons, and only after a few pixels of travel so a tap still
 * reads as a tap.
 *
 * Drag-and-drop is not reachable by keyboard by nature; the grip also takes
 * ArrowUp/ArrowDown, and the edit dialog can set the day directly.
 */
export function useItemDrag(layout: DayLayout[], onDrop: (itemId: string, target: DropTarget) => void) {
  const dayEls = useRef(new Map<string, HTMLElement>());
  const itemEls = useRef(new Map<string, HTMLElement>());
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const [dragId, setDragId] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const session = useRef<{
    id: string;
    startX: number;
    startY: number;
    offX: number;
    offY: number;
    w: number;
    h: number;
    active: boolean;
  } | null>(null);
  const scroller = useRef(0);

  const registerDay = useCallback((date: string, el: HTMLElement | null) => {
    if (el) dayEls.current.set(date, el);
    else dayEls.current.delete(date);
  }, []);

  const registerItem = useCallback((id: string, el: HTMLElement | null) => {
    if (el) itemEls.current.set(id, el);
    else itemEls.current.delete(id);
  }, []);

  /** Nearest day under the pointer, then the gap within it the pointer sits in. */
  const resolve = useCallback((x: number, y: number, draggedId: string): DropTarget | null => {
    void x;
    let hit: string | null = null;
    let nearest: { date: string; dist: number } | null = null;

    for (const { date } of layoutRef.current) {
      const el = dayEls.current.get(date);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        hit = date;
        break;
      }
      const dist = y < r.top ? r.top - y : y - r.bottom;
      if (!nearest || dist < nearest.dist) nearest = { date, dist };
    }

    const date = hit ?? nearest?.date;
    if (!date) return null;

    const ids = (layoutRef.current.find((d) => d.date === date)?.itemIds ?? []).filter((i) => i !== draggedId);
    let index = ids.length;
    for (let i = 0; i < ids.length; i++) {
      const el = itemEls.current.get(ids[i]);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y < r.top + r.height / 2) {
        index = i;
        break;
      }
    }
    return { date, index };
  }, []);

  const stop = useCallback(() => {
    session.current = null;
    setDragId(null);
    setTarget(null);
    setGhost(null);
    if (scroller.current) {
      cancelAnimationFrame(scroller.current);
      scroller.current = 0;
    }
    document.body.style.userSelect = '';
  }, []);

  const onGripPointerDown = useCallback(
    (e: ReactPointerEvent, id: string) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const row = itemEls.current.get(id);
      if (!row) return;
      const r = row.getBoundingClientRect();
      session.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        offX: e.clientX - r.left,
        offY: e.clientY - r.top,
        w: r.width,
        h: r.height,
        active: false,
      };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const s = session.current;
      if (!s) return;
      if (!s.active) {
        if (Math.hypot(e.clientX - s.startX, e.clientY - s.startY) < START_THRESHOLD) return;
        s.active = true;
        setDragId(s.id);
        document.body.style.userSelect = 'none';
      }
      e.preventDefault();
      setGhost({ x: e.clientX - s.offX, y: e.clientY - s.offY, w: s.w, h: s.h });
      setTarget(resolve(e.clientX, e.clientY, s.id));

      // Keep dragging usable when the target day is off-screen.
      const dy = e.clientY < EDGE ? -EDGE_SPEED : e.clientY > window.innerHeight - EDGE ? EDGE_SPEED : 0;
      if (dy && !scroller.current) {
        const tick = () => {
          window.scrollBy(0, dy);
          scroller.current = session.current?.active ? requestAnimationFrame(tick) : 0;
        };
        scroller.current = requestAnimationFrame(tick);
      } else if (!dy && scroller.current) {
        cancelAnimationFrame(scroller.current);
        scroller.current = 0;
      }
    };

    const up = () => {
      const s = session.current;
      if (s?.active && target) onDrop(s.id, target);
      stop();
    };

    const cancel = () => stop();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && session.current?.active) stop();
    };

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
    };
  }, [resolve, onDrop, target, stop]);

  return { dragId, target, ghost, registerDay, registerItem, onGripPointerDown };
}

/**
 * Where an item lands when nudged one slot with the keyboard: up past the top
 * of a day carries it to the end of the previous day, and vice versa.
 */
export function stepTarget(layout: DayLayout[], itemId: string, dir: -1 | 1): DropTarget | null {
  const dayIdx = layout.findIndex((d) => d.itemIds.includes(itemId));
  if (dayIdx === -1) return null;
  const day = layout[dayIdx];
  const pos = day.itemIds.indexOf(itemId);
  const next = pos + dir;

  if (next >= 0 && next < day.itemIds.length) return { date: day.date, index: next };
  if (dir === -1) {
    const prev = layout[dayIdx - 1];
    return prev ? { date: prev.date, index: prev.itemIds.length } : null;
  }
  const after = layout[dayIdx + 1];
  return after ? { date: after.date, index: 0 } : null;
}
