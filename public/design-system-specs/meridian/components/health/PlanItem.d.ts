import * as React from 'react';
export interface PlanItemProps {
  label?: React.ReactNode;
  current?: number;
  target?: number;
  channel?: 'brand' | 'recovery' | 'strain' | 'sleep';
  variant?: 'ring' | 'fraction';
  done?: boolean;
  style?: React.CSSProperties;
}
/** Gamified goal row with a count ring (e.g. 2/7); completes to mint. */
export function PlanItem(props: PlanItemProps): JSX.Element;
