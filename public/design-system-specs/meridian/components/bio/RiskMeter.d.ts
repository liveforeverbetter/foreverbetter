import * as React from 'react';
export interface RiskBand { key: string; label: string; tone: string; }
export interface RiskMeterProps {
  level?: string;
  label?: React.ReactNode;
  caption?: React.ReactNode;
  /** Override the default reduced/typical/increased/high bands. */
  segments?: RiskBand[];
  style?: React.CSSProperties;
}
/** Segmented genetic / biomarker risk gauge with the active band highlighted. */
export function RiskMeter(props: RiskMeterProps): JSX.Element;
