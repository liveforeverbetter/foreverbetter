import * as React from 'react';
export interface ContextMenuItem {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  shortcut?: string;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
}
export interface ContextMenuProps {
  items?: ContextMenuItem[];
  children?: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
}
/** Floating menu surface built from MenuItems. */
export function ContextMenu(props: ContextMenuProps): JSX.Element;
