import * as React from 'react';
export interface CodeInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  style?: React.CSSProperties;
}
/** Segmented one-time-code / verification entry. */
export function CodeInput(props: CodeInputProps): JSX.Element;
