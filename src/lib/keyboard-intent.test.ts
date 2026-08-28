import { describe, it, expect } from 'vitest';
import { keyToIntent } from './keyboard-intent';

// --- P3-1: keyToIntent ---
describe('P3-1 keyToIntent', () => {
  it('lowercase letters map to uppercase letter intents', () => {
    expect(keyToIntent('a')).toEqual({ type: 'letter', letter: 'A' });
    expect(keyToIntent('z')).toEqual({ type: 'letter', letter: 'Z' });
  });

  it('uppercase letters map to letter intents', () => {
    expect(keyToIntent('A')).toEqual({ type: 'letter', letter: 'A' });
    expect(keyToIntent('Z')).toEqual({ type: 'letter', letter: 'Z' });
  });

  it('Backspace maps to a delete intent', () => {
    expect(keyToIntent('Backspace')).toEqual({ type: 'delete' });
  });

  it('arrow keys map to arrow intents', () => {
    expect(keyToIntent('ArrowUp')).toEqual({ type: 'arrow', direction: 'up' });
    expect(keyToIntent('ArrowDown')).toEqual({ type: 'arrow', direction: 'down' });
    expect(keyToIntent('ArrowLeft')).toEqual({ type: 'arrow', direction: 'left' });
    expect(keyToIntent('ArrowRight')).toEqual({ type: 'arrow', direction: 'right' });
  });

  it('unhandled keys map to null', () => {
    expect(keyToIntent('1')).toBeNull();
    expect(keyToIntent(' ')).toBeNull();
    expect(keyToIntent('Shift')).toBeNull();
    expect(keyToIntent('Enter')).toBeNull();
    expect(keyToIntent('Escape')).toBeNull();
    expect(keyToIntent('Tab')).toBeNull();
  });

  it('purity: two calls with the same key are deep-equal', () => {
    expect(keyToIntent('a')).toEqual(keyToIntent('a'));
    expect(keyToIntent('ArrowUp')).toEqual(keyToIntent('ArrowUp'));
  });
});
