import * as React from 'react';
export interface BiomarkerRowProps {
  name?: React.ReactNode;
  value?: number | string;
  unit?: string;
  status?: 'optimal' | 'high' | 'low' | 'critical';
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
  min?: number;
  max?: number;
  optimalLow?: number;
  optimalHigh?: number;
  showRange?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** A single lab result: value, status pill, trend and reference RangeBar.
 * @startingPoint section="Bio" subtitle="Biomarker & genetic data" viewport="700x420" */
export function BiomarkerRow(props: BiomarkerRowProps): JSX.Element;
