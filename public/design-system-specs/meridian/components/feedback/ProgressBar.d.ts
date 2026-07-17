import * as React from 'react';
export interface ProgressBarProps {
  value?: number;
  max?: number;
  tone?: 'brand' | 'recovery' | 'strain' | 'sleep' | 'warning' | 'danger';
  height?: number;
  label?: React.ReactNode;
  valueLabel?: string;
  showValue?: boolean;
  style?: React.CSSProperties;
}
/** Linear determinate progress — plan completion & goals. */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
