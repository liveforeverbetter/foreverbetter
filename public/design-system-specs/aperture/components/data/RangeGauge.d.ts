import * as React from "react";

export interface RangeGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Marker position, 0–1. */
  value: number;
  /** Optimal/target band as [start, end], 0–1. */
  band?: [number, number];
  leftLabel?: React.ReactNode;
  rightLabel?: React.ReactNode;
  /** Status headline shown above the bar (e.g. "Balanced"). */
  status?: React.ReactNode;
  statusTone?: "excellent" | "good" | "fair" | "attention";
  height?: number;
}

/** Horizontal range gauge with a hatched optimal band and a marker — cardio load, vascular load, etc. */
export function RangeGauge(props: RangeGaugeProps): JSX.Element;
