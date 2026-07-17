import * as React from 'react';
export interface SidebarItem { value?: string; label?: string; icon?: React.ReactNode; badge?: React.ReactNode; section?: string; }
/** Desktop/tablet sidebar with brand lockup and mint active rail.
 * @startingPoint section="Navigation" subtitle="Desktop sidebar" viewport="260x520" */
export interface SidebarProps {
  items?: SidebarItem[];
  value?: string;
  onChange?: (value: string) => void;
  footer?: React.ReactNode;
  brand?: string;
  collapsed?: boolean;
  style?: React.CSSProperties;
}
/** Desktop/tablet sidebar with brand lockup and mint active rail. */
export function Sidebar(props: SidebarProps): JSX.Element;
