import * as React from 'react';
export interface SparklineProps {
  data?: (number | { value: number })[];
  channel?: 'recovery' | 'strain' | 'sleep' | 'stress' | 'brand';
  width?: number;
  height?: number;
  showArea?: boolean;
  style?: React.CSSProperties;
}
/** Tiny inline trend line for stat tiles and rows. */
export function Sparkline(props: SparklineProps): JSX.Element;
