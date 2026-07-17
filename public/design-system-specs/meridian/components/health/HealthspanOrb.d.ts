import * as React from 'react';
/** Hero longevity visual: a glowing particle sphere with a center readout. */
export interface HealthspanOrbProps {
  value?: React.ReactNode;
  label?: string;
  caption?: React.ReactNode;
  tone?: 'good' | 'watch' | 'poor' | 'strain';
  size?: number;
  animate?: boolean;
  style?: React.CSSProperties;
}
/** Hero longevity visual: a glowing particle sphere with a center readout. */
export function HealthspanOrb(props: HealthspanOrbProps): JSX.Element;
