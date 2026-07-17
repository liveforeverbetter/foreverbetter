import * as React from 'react';
export interface TrendPoint { value: number; label?: string; }
export interface TrendChartProps {
  data?: (number | TrendPoint)[];
  channel?: 'recovery' | 'strain' | 'sleep' | 'stress' | 'brand';
  height?: number;
  min?: number;
  max?: number;
  /** Optimal band as [low, high] in data units; shaded behind the line. */
  band?: [number, number];
  /** X-axis labels rendered evenly below the chart. */
  labels?: React.ReactNode[];
  showDots?: boolean;
  showArea?: boolean;
  showLast?: boolean;
  valueFormat?: (v: number) => React.ReactNode;
  style?: React.CSSProperties;
}
/** The system's time-series visual: smooth line + area fill, per channel.
 * @startingPoint section="Charts" subtitle="Trend lines & sparklines" viewport="700x260" */
export function TrendChart(props: TrendChartProps): JSX.Element;
