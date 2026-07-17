import * as React from 'react';
export interface ListItemProps {
  icon?: React.ReactNode;
  iconTone?: 'neutral' | 'brand' | 'recovery' | 'strain' | 'sleep' | 'warning';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  divider?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Tappable row: leading icon tile, title/subtitle, trailing value + chevron. */
export function ListItem(props: ListItemProps): JSX.Element;
