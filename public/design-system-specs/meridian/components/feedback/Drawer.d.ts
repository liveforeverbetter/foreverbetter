import * as React from 'react';
export interface DrawerProps {
  open?: boolean;
  side?: 'right' | 'bottom';
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  size?: number;
  style?: React.CSSProperties;
}
/** Edge-anchored sheet (right on desktop, bottom on mobile). */
export function Drawer(props: DrawerProps): JSX.Element | null;
