import * as React from 'react';
export interface MenuItemProps {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  shortcut?: string;
  trailing?: React.ReactNode;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Row for dropdowns, context menus & popovers. */
export function MenuItem(props: MenuItemProps): JSX.Element;
