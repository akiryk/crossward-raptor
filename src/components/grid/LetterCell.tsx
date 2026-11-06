'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { CellNumber } from './CellNumber';

// A rebus is as large as fits the cell, up to the letter size, and never
// below a third of it; longer, it is centered and cut off at the cell's
// edges (17-S10).
const REBUS_WIDTH_PER_PITCH = 0.88;
const REBUS_MIN_PER_LETTER = 1 / 3;
// An uppercase letter's width in ems, until the text is measured.
const ESTIMATED_EM_PER_CHARACTER = 0.72;

/**
 * The text's width in ems, measured in the browser. Font size scales a
 * line's width, so one measurement fits the text at any cell size.
 */
export function useEmWidth(text: string, ref: RefObject<HTMLElement | null>) {
  const [emWidth, setEmWidth] = useState(text.length * ESTIMATED_EM_PER_CHARACTER);
  useLayoutEffect(() => {
    let isCurrent = true;
    function measure() {
      const element = ref.current;
      if (!isCurrent || !element) return;
      const fontSize = parseFloat(getComputedStyle(element).fontSize);
      const width = element.getBoundingClientRect().width;
      if (fontSize > 0 && width > 0) setEmWidth(width / fontSize);
    }
    measure();
    // Measured again once the web font replaces the fallback.
    document.fonts?.ready.then(measure);
    return () => {
      isCurrent = false;
    };
  }, [text, ref]);
  return Math.max(emWidth, 1e-3);
}

function RebusLetters({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const emWidth = useEmWidth(text, ref);
  return (
    <span
      ref={ref}
      className="whitespace-nowrap"
      style={{
        fontSize: `clamp(calc(var(--cell-letter-size) * ${REBUS_MIN_PER_LETTER}), calc(var(--cell-pitch) * ${REBUS_WIDTH_PER_PITCH} / ${emWidth}), var(--cell-letter-size))`,
      }}
    >
      {text}
    </span>
  );
}

export function LetterCell({
  letter,
  number,
  isLocked = false,
  onClick,
}: {
  letter: string;
  number?: number;
  /** Build phase: a locked word's letter is gray (21-S2). */
  isLocked?: boolean;
  onClick?: () => void;
}) {
  const isRebus = letter.length > 1;
  return (
    // Centered, or on a Sunday low in the cell, as the NYT's (17-S7): the
    // grid sets the alignment and the space above. A rebus is centered in
    // the space below that, and cut off at the cell's edges (17-S10).
    <div
      className={`text-cell-letter ${isLocked ? 'text-(color:--palette-gray-500)' : 'text-primary'} relative flex h-full w-full justify-center uppercase${isRebus ? ' overflow-hidden' : ''}`}
      style={{
        fontSize: 'var(--cell-letter-size)',
        lineHeight: 1,
        alignItems: isRebus ? 'center' : 'var(--cell-letter-align, center)',
        paddingTop: 'var(--cell-letter-top, 0px)',
      }}
      onClick={onClick}
    >
      {number !== undefined && <CellNumber number={number} />}
      {isRebus ? <RebusLetters text={letter} /> : letter}
    </div>
  );
}
