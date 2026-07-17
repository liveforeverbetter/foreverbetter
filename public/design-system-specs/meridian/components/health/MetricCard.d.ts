import * as React from 'react';
export interface MetricCardProps {
  channel?: 'recovery' | 'strain' | 'sleep' | 'stress' | 'brand';
  value?: number;
  max?: number;
  display?: React.ReactNode;
  unit?: string;
  label?: React.ReactNode;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
  note?: React.ReactNode;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** A Card wrapping a MetricRing with a trend delta. */
export function MetricCard(props: MetricCardProps): JSX.Element;
