import * as React from 'react';
/** The signature circular progress gauge — core visual of the system. */
export interface MetricRingProps {
  value?: number;
  max?: number;
  channel?: 'recovery' | 'strain' | 'sleep' | 'stress' | 'brand';
  size?: number;
  thickness?: number;
  label?: React.ReactNode;
  /** Center readout override (defaults to `value`). */
  display?: React.ReactNode;
  unit?: string;
  sublabel?: React.ReactNode;
  /** Arc degrees swept (default 300 leaves a bottom gap). Use 360 for a full ring. */
  sweep?: number;
  glow?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
/** The signature circular progress gauge — core visual of the system. */
export function MetricRing(props: MetricRingProps): JSX.Element;
