export interface GoogleFontLink {
  readonly href: string;
  readonly families: readonly string[];
}

/**
 * Parses a Google Fonts stylesheet URL into the families it provides.
 * Returns null for anything that isn't a fonts.googleapis.com URL, or that
 * names no families -- a style guide that injects an arbitrary stylesheet
 * from any host is a hole, not a feature.
 *
 * Handles the `+` encoding for spaces ("Space+Grotesk" -> "Space Grotesk")
 * and multiple `family=` parameters in one URL.
 */
export function parseGoogleFontUrl(url: string): GoogleFontLink | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // Exact match, not a suffix/includes check -- fonts.googleapis.com.evil.example.com
  // is a different host that merely contains the real one as a substring.
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'fonts.googleapis.com') {
    return null;
  }

  const families = parsed.searchParams
    .getAll('family')
    // URLSearchParams already decodes '+' as a space per form-urlencoded
    // rules; the explicit replace is a harmless belt-and-suspenders for
    // any family name that reaches here still literally containing one.
    .map((raw) => raw.split(':')[0].replace(/\+/g, ' ').trim())
    .filter((name) => name !== '');

  if (families.length === 0) return null;

  return { href: url, families };
}
