import * as React from 'react';
export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  inset?: number;
  style?: React.CSSProperties;
}
/** Hairline divider, optionally with a centered uppercase label. */
export function Separator(props: SeparatorProps): JSX.Element;
