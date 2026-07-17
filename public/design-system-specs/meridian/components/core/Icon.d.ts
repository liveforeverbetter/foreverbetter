import * as React from 'react';
export interface IconProps {
  /** Lucide icon name, e.g. "heart-pulse", "moon", "activity". */
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
}
/** Lucide icon wrapper. Requires the Lucide UMD script on the page. */
export function Icon(props: IconProps): JSX.Element;
