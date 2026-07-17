import * as React from 'react';
/** Base dark surface for dashboard content. */
export interface CardProps {
  children?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  raised?: boolean;
  interactive?: boolean;
  /** Colored ambient halo for live-metric emphasis. */
  glow?: 'recovery' | 'strain' | 'sleep' | 'brand' | null;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export interface CardHeaderProps {
  label?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
/** Base dark surface for dashboard content. */
export function Card(props: CardProps): JSX.Element;
export function CardHeader(props: CardHeaderProps): JSX.Element;
