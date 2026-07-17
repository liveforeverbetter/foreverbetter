import * as React from 'react';
export interface TopNavUser { name?: string; tone?: 'brand' | 'warm' | 'violet' | 'slate'; }
export interface TopNavProps {
  user?: TopNavUser;
  date?: string;
  battery?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onAvatar?: () => void;
  style?: React.CSSProperties;
}
/** Mobile top chrome: avatar · date stepper · battery readout. */
export function TopNav(props: TopNavProps): JSX.Element;
