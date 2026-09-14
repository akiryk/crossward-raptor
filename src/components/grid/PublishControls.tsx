'use client';

import { useState } from 'react';
import type { Visibility } from '../../app/puzzles/actions';
import { Button } from '../ui/Button';

export function PublishControls({
  isPublished,
  visibility,
  onPublish,
  onUnpublish,
}: {
  isPublished: boolean;
  visibility: Visibility;
  onPublish: (visibility: Visibility) => void;
  onUnpublish: () => void;
}) {
  const [isPrivate, setIsPrivate] = useState(true);

  if (isPublished) {
    return (
      <div className="flex items-center gap-3">
        <p data-testid="publish-state">Published, {visibility}.</p>
        <Button variant="quiet" data-testid="unpublish-button" onClick={onUnpublish}>
          Unpublish
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p data-testid="publish-state">Not published yet.</p>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          data-testid="private-checkbox"
          checked={isPrivate}
          onChange={(event) => setIsPrivate(event.target.checked)}
        />
        Keep private
      </label>
      <Button
        data-testid="publish-button"
        onClick={() => onPublish(isPrivate ? 'private' : 'public')}
      >
        Publish
      </Button>
    </div>
  );
}
