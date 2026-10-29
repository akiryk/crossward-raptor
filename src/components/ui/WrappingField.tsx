'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef, Ref } from 'react';

/** One line of text that wraps onto as many lines as it needs, the field
 *  growing with it (15-S6): the editor's title and the hint fields. Enter
 *  adds no line break and a pasted one becomes a space. */
export function WrappingField({
  value,
  onChange,
  ref,
  ...props
}: Omit<ComponentPropsWithoutRef<'textarea'>, 'value' | 'onChange' | 'rows'> & {
  value: string;
  onChange: (value: string) => void;
  ref?: Ref<HTMLTextAreaElement>;
}) {
  const own = useRef<HTMLTextAreaElement | null>(null);

  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      own.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref]
  );

  // The field's height is its content's: measured at its natural one row,
  // then set to the scroll height plus its borders.
  const fit = useCallback(() => {
    const el = own.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + borders}px`;
  }, []);

  useLayoutEffect(fit, [fit, value]);

  // A new width (a narrower window, the wide layout's larger type) or a
  // late-loading font rewraps the text.
  useLayoutEffect(() => {
    const el = own.current;
    if (!el) return;
    let width = el.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const next = el.getBoundingClientRect().width;
      if (next !== width) {
        width = next;
        fit();
      }
    });
    observer.observe(el);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [fit]);

  return (
    <textarea
      {...props}
      ref={setRef}
      // A textarea's own Tab order, made explicit: it stays a Tab stop
      // wherever the one-line input it replaced was ([tabindex]).
      tabIndex={props.disabled ? undefined : 0}
      rows={1}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\r\n|\r|\n/g, ' '))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.preventDefault();
        props.onKeyDown?.(event);
      }}
      className={`block resize-none overflow-hidden ${props.className ?? ''}`}
    />
  );
}
