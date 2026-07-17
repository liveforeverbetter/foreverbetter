import * as React from 'react';
export interface StatTileProps {
  icon?: React.ReactNode;
  iconTone?: 'neutral' | 'recovery' | 'strain' | 'sleep' | 'stress' | 'brand';
  label?: React.ReactNode;
  value?: React.ReactNode;
  unit?: string;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
  secondary?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Compact labeled metric — big number, unit and delta. */
export function StatTile(props: StatTileProps): JSX.Element;
