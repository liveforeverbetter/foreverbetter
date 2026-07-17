import * as React from "react";

export interface SidebarItem {
  id?: string; label: string; icon?: React.ReactNode; badge?: string | number;
  /** Render as a section heading instead of a nav link. */
  section?: boolean;
}
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  brand?: string;
  items: SidebarItem[];
  active?: string;
  onSelect?: (id: string) => void;
  footer?: React.ReactNode;
}

/**
 * Desktop dashboard navigation rail with brand lockup, grouped links, and a footer slot.
 * @startingPoint section="Layout" subtitle="Dashboard sidebar nav" viewport="260x560"
 */
export function Sidebar(props: SidebarProps): JSX.Element;
