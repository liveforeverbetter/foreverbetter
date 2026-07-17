import * as React from "react";

export interface AreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[];
  /** Line + fill color (a domain/score CSS var). */
  color?: string;
  fillOpacity?: number;
  height?: number;
  min?: number;
  max?: number;
  /** Shaded target band as [min, max] in data units. */
  targetBand?: [number, number];
  xLabels?: string[];
  yTicks?: number;
  smooth?: boolean;
}

/** Compact area chart with gradient fill and optional target band. */
export function AreaChart(props: AreaChartProps): JSX.Element;
