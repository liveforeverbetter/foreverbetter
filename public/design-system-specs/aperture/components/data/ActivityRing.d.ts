import * as React from "react";

export interface ActivityRingSpec { value: number; max: number; color: string; track?: string; }
export interface ActivityRingProps extends React.SVGAttributes<SVGElement> {
  /** Concentric rings, outermost first. */
  rings: ActivityRingSpec[];
  size?: number;
  thickness?: number;
  gap?: number;
}

/** Concentric activity rings (Move / Exercise / Stand style) for the daily-activity summary. */
export function ActivityRing(props: ActivityRingProps): JSX.Element;
