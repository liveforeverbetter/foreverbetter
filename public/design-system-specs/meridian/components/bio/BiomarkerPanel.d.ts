import * as React from 'react';
export interface BiomarkerPanelProps {
  name?: React.ReactNode;
  collected?: string;
  inRange?: number;
  total?: number;
  children?: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
/** Grouped lab panel card (Metabolic, Lipids, ...) wrapping BiomarkerRow children. */
export function BiomarkerPanel(props: BiomarkerPanelProps): JSX.Element;
