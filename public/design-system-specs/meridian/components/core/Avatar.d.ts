import * as React from 'react';
export interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  tone?: 'brand' | 'warm' | 'violet' | 'slate';
  ring?: boolean;
  style?: React.CSSProperties;
}
/** Circular portrait with monogram fallback and optional brand ring. */
export function Avatar(props: AvatarProps): JSX.Element;
