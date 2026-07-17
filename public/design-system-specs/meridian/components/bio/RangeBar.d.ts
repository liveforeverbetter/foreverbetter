import * as React from 'react';
export interface RangeZone { to: number; tone: 'low' | 'optimal' | 'high' | 'critical' | 'track'; }
export interface RangeBarProps {
  value?: number;
  min?: number;
  max?: number;
  optimalLow?: number;
  optimalHigh?: number;
  /** Explicit colored zones as boundary stops; overrides the optimal window. */
  zones?: RangeZone[];
  height?: number;
  showScale?: boolean;
  valueLabel?: React.ReactNode;
  style?: React.CSSProperties;
}
/** The signature biomarker reference-range visual: zoned track with a value marker. */
export function RangeBar(props: RangeBarProps): JSX.Element;
