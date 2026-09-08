'use client';

import { useEffect, useRef, useState } from 'react';
import { saveTitle } from '../../app/puzzles/actions';
import { TextInput } from '../ui/TextInput';

const SAVE_DEBOUNCE_MS = 500;

export function PuzzleTitle({
  puzzleId,
  initialTitle,
}: {
  puzzleId: string;
  initialTitle: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveTitle(puzzleId, title).catch((error) => {
        console.error('Failed to save puzzle title', error);
      });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, puzzleId]);

  return (
    <TextInput data-testid="puzzle-title" aria-label="Puzzle title" value={title} onChange={setTitle} />
  );
}
