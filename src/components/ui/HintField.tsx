import type { ComponentProps } from 'react';
import { WrappingField } from './WrappingField';

/** A decorative first-word background beneath the native editor. The wrapper
 * remains mounted as recognition changes, preserving focus and selection. */
export function HintField({ linked, backdropClassName = '', wrapperClassName = '', markClassName = '', ...props }:
  ComponentProps<typeof WrappingField> & {
    linked: boolean;
    backdropClassName?: string;
    wrapperClassName?: string;
    markClassName?: string;
  }) {
  return <div className={`relative ${wrapperClassName} ${linked ? backdropClassName : ''}`}>
    {linked && <span aria-hidden="true" data-testid="linked-clue-with"
      className={`pointer-events-none absolute bg-linked-clue text-transparent ${markClassName}`}>{props.value.slice(0, 4)}</span>}
    <WrappingField {...props} className={`${props.className ?? ''} relative ${linked ? 'bg-transparent!' : ''}`} />
  </div>;
}
