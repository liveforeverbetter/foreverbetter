import * as React from 'react';
export interface BadgeProps {
  children?: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'sleep';
  variant?: 'soft' | 'solid';
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}
/** Compact status/label pill using the performance palette. */
export function Badge(props: BadgeProps): JSX.Element;
