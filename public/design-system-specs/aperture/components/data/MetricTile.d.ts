import * as React from "react";

export interface MetricTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  /** Status pill text (e.g. "Good", "High"). */
  status?: React.ReactNode;
  statusTone?: "excellent" | "good" | "fair" | "attention";
  icon?: React.ReactNode;
  iconTone?: string;
  hint?: React.ReactNode;
  onClick?: () => void;
}

/** Compact metric tile with big value + status pill — the grid workhorse for biomarker/vitals panels. */
export function MetricTile(props: MetricTileProps): JSX.Element;
