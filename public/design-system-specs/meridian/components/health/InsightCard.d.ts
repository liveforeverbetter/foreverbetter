import * as React from 'react';
export interface InsightCardProps {
  icon?: React.ReactNode;
  iconTone?: 'brand' | 'recovery' | 'strain' | 'sleep' | 'stress' | 'neutral';
  title?: React.ReactNode;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Coaching insight / daily-outlook row. */
export function InsightCard(props: InsightCardProps): JSX.Element;
