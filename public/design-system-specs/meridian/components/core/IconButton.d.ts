import * as React from 'react';
export interface IconButtonProps {
  children?: React.ReactNode;
  variant?: 'ghost' | 'subtle' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  round?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  'aria-label'?: string;
  style?: React.CSSProperties;
}
/** Icon-only button for chrome actions. Always pass aria-label. */
export function IconButton(props: IconButtonProps): JSX.Element;
