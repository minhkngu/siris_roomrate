import React, { useEffect, useRef, useState } from 'react';

interface RoomCarouselProps {
  /** When this value changes the row jumps back to the first room. */
  resetKey: string;
  /** Word shown before the counter, e.g. "Phòng" → "Phòng 2 / 8". */
  label: string;
  children: React.ReactNode;
}

/**
 * Below `sm` the room cards form a native horizontal scroll-snap row;
 * from `sm` up it renders the usual grid unchanged.
 */
export const RoomCarousel: React.FC<RoomCarouselProps> = ({ resetKey, label, children }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const items = React.Children.toArray(children);
  const count = items.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const onScroll = () => {
      const first = row.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const step = first.offsetWidth + gap;
      if (step <= 0) return;
      const index = Math.max(0, Math.min(count - 1, Math.round(row.scrollLeft / step)));
      setActive(index);
    };

    row.addEventListener('scroll', onScroll, { passive: true });
    return () => row.removeEventListener('scroll', onScroll);
  }, [count]);

  useEffect(() => {
    if (rowRef.current) rowRef.current.scrollLeft = 0;
    setActive(0);
  }, [resetKey]);

  return (
    <>
      {count > 1 && (
        <div
          data-testid="room-counter"
          className="sm:hidden mb-2 text-right text-xs font-semibold tracking-wide text-slate-500"
        >
          {label} {Math.min(active, count - 1) + 1} / {count}
        </div>
      )}
      <div
        ref={rowRef}
        data-testid="room-row"
        className="flex overflow-x-auto snap-x snap-mandatory scroll-px-4 -mx-4 px-4 gap-4 scrollbar-hide items-stretch sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-8 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0"
      >
        {items.map((child, i) => (
          <div key={(child as React.ReactElement).key ?? i} className="shrink-0 w-[88%] snap-start sm:w-auto">
            {child}
          </div>
        ))}
      </div>
    </>
  );
};
