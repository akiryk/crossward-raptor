'use client';

import { useRef } from 'react';
import { rebusIntent, rebusText } from '../../lib/rebus-entry';
import { useEmWidth } from './LetterCell';

// The open cell is 4/3 of a grid cell (17-S10); its text, as large as the
// letter size while it fits, fills at most this much of it.
const ENTRY_WIDTH_PER_PITCH = 1.2;

export interface RebusEntryProps {
  value: string;
  onChange: (value: string) => void;
  onClose: (advance: boolean) => void;
}

export function RebusEntry({ value, onChange, onClose, bg }: RebusEntryProps & { bg: string }) {
  const closed = useRef(false);
  function close(advance: boolean) {
    if (closed.current) return;
    closed.current = true;
    onClose(advance);
  }
  const mirror = useRef<HTMLSpanElement>(null);
  const emWidth = useEmWidth(value, mirror);
  return (
    <div
      data-testid="rebus-entry"
      className={`absolute top-1/2 left-1/2 z-10 flex size-[133.333%] -translate-x-1/2 -translate-y-1/2 items-center justify-center shadow-rebus-cell ${bg}`}
    >
      {/* Measures the text's width; never seen. */}
      <span
        ref={mirror}
        aria-hidden
        className="text-cell-letter invisible absolute whitespace-pre uppercase"
        style={{ fontSize: 'var(--cell-letter-size)' }}
      >
        {value}
      </span>
      <input
        aria-label="Rebus entry"
        autoFocus
        value={value}
        onFocus={(event) => event.currentTarget.setSelectionRange(value.length, value.length)}
        onChange={(event) => onChange(rebusText(event.target.value))}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (rebusIntent(event.key, true) === 'close') {
            event.preventDefault();
            close(true);
          }
        }}
        onBlur={() => close(false)}
        className="text-cell-letter text-primary h-full w-full min-w-0 bg-transparent p-0 text-center uppercase outline-none"
        style={{ fontSize: `min(var(--cell-letter-size), calc(var(--cell-pitch) * ${ENTRY_WIDTH_PER_PITCH} / ${emWidth}))` }}
      />
    </div>
  );
}
