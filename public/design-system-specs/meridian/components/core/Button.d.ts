import * as React from 'react';

/**
 * The primary action control. One mint-fill primary per view; everything else recedes.
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual weight. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Fully rounded ends. @default false */
  pill?: boolean;
  /** Full-width block. @default false */
  block?: boolean;
  disabled?: boolean;
  /** Swap label for a spinner. @default false */
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/**
 * The primary action control. One mint-fill primary per view; everything else recedes.
 */
export function Button(props: ButtonProps): JSX.Element;
