import { describe, it, expect } from 'vitest';
import { parseGoogleFontUrl } from './google-font';

const INTER = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';

// --- D10-1: parseGoogleFontUrl ---
describe('D10-1 parseGoogleFontUrl', () => {
  it('parses a standard Google Fonts URL', () => {
    const parsed = parseGoogleFontUrl(INTER);

    expect(parsed).not.toBeNull();
    expect(parsed!.families).toEqual(['Inter']);
    expect(parsed!.href).toBe(INTER);
  });

  it('decodes + as a space in family names', () => {
    const parsed = parseGoogleFontUrl(
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&display=swap'
    );

    expect(parsed!.families).toEqual(['Space Grotesk']);
  });

  it('returns every family when a URL names several, in order', () => {
    const parsed = parseGoogleFontUrl(
      'https://fonts.googleapis.com/css2?family=Inter&family=Space+Grotesk&display=swap'
    );

    expect(parsed!.families).toEqual(['Inter', 'Space Grotesk']);
  });

  it('strips the weight/style axis from the family name', () => {
    const parsed = parseGoogleFontUrl(
      'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;1,700'
    );

    expect(parsed!.families).toEqual(['Roboto']);
  });

  it('rejects any other host, including one mimicking the path', () => {
    expect(
      parseGoogleFontUrl('https://evil.example.com/css2?family=Inter')
    ).toBeNull();
    expect(
      parseGoogleFontUrl('https://fonts.googleapis.com.evil.example.com/css2?family=Inter')
    ).toBeNull();
  });

  it('rejects non-https URLs on the Google host', () => {
    expect(
      parseGoogleFontUrl('http://fonts.googleapis.com/css2?family=Inter')
    ).toBeNull();
  });

  it('rejects a Google URL that names no family', () => {
    expect(parseGoogleFontUrl('https://fonts.googleapis.com/css2?display=swap')).toBeNull();
    expect(parseGoogleFontUrl('https://fonts.googleapis.com/css2?family=')).toBeNull();
  });

  it('rejects empty, whitespace, and non-URLs', () => {
    expect(parseGoogleFontUrl('')).toBeNull();
    expect(parseGoogleFontUrl('   ')).toBeNull();
    expect(parseGoogleFontUrl('not a url')).toBeNull();
    expect(parseGoogleFontUrl('Inter')).toBeNull();
  });

  it('purity: two calls on the same input are deep-equal', () => {
    expect(parseGoogleFontUrl(INTER)).toEqual(parseGoogleFontUrl(INTER));
  });
});
