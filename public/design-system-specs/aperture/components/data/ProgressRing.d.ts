import * as React from "react";

export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  /** Stroke color — pass a domain/score CSS var, e.g. "var(--score-good)". */
  color?: string;
  track?: string;
  rounded?: boolean;
  /** Center content (a value + label). */
  children?: React.ReactNode;
}

/** Single circular progress ring with centered content. */
export function ProgressRing(props: ProgressRingProps): JSX.Element;
