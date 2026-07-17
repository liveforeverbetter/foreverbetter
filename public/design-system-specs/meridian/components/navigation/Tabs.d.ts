import * as React from 'react';
export interface TabItem { value: string; label: string; }
export interface TabsProps {
  items?: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'underline' | 'segmented';
  style?: React.CSSProperties;
}
/** Underline or segmented tab switcher. */
export function Tabs(props: TabsProps): JSX.Element;
