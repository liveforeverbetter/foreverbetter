import * as React from 'react';
export interface SpinnerProps { size?: number; color?: string; track?: string; thickness?: number; }
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: string;
  circle?: boolean;
  style?: React.CSSProperties;
}
/** Indeterminate circular loader. */
export function Spinner(props: SpinnerProps): JSX.Element;
/** Shimmering placeholder block. */
export function Skeleton(props: SkeletonProps): JSX.Element;
/** Default indeterminate loader (alias of Spinner). */
export function Loader(props: SpinnerProps): JSX.Element;
