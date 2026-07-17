import * as React from 'react';
export interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Number of gauge tick marks to render above the rail. */
  ticks?: number;
  leftLabel?: string;
  rightLabel?: string;
  /** Big centered readout above the rail. */
  valueLabel?: string;
  tone?: 'brand' | 'recovery' | 'strain' | 'sleep';
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
}
/** Labeled range with an optional tick-mark gauge (pace-of-aging style). */
export function Slider(props: SliderProps): JSX.Element;
