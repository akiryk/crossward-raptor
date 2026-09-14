'use client';

import { useState } from 'react';
import { parseGoogleFontUrl } from '../../lib/google-font';

/**
 * Pastes a Google Fonts stylesheet URL, injects it as a real <link> on
 * apply, and reports the families it names back up so the font-family
 * selects can offer them. No persistence, same as every other style-guide
 * control -- a reload clears the injected link along with the state here.
 */
export function FontLoader({
  onLoaded,
}: {
  onLoaded: (families: readonly string[]) => void;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleApply() {
    const parsed = parseGoogleFontUrl(url);
    if (!parsed) {
      setError('Not a valid Google Fonts stylesheet URL.');
      return;
    }
    setError(null);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = parsed.href;
    document.head.appendChild(link);

    onLoaded(parsed.families);
  }

  return (
    <div className="flex flex-col gap-2 border-b border-rule py-2">
      <div className="flex items-center gap-2">
        <input
          data-testid="font-url-input"
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste a Google Fonts URL"
          className="flex-1 rounded-md border border-rule-strong bg-background px-2 py-1 text-label"
        />
        <button
          type="button"
          data-testid="font-url-apply"
          onClick={handleApply}
          className="cursor-pointer rounded-btn border border-rule-strong px-3 py-1 text-label"
        >
          Apply
        </button>
      </div>
      {error && (
        <p data-testid="font-url-error" className="text-required">
          {error}
        </p>
      )}
    </div>
  );
}
