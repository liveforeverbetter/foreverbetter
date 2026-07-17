import * as React from "react";

export interface ScoreCardProps extends React.HTMLAttributes<HTMLDivElement> {
  score: React.ReactNode;
  max?: number;
  /** Band label, e.g. "Good". */
  band?: string;
  tone?: "excellent" | "good" | "fair" | "attention";
  /** Signed change vs baseline, rendered as a ▲/▼ chip. */
  delta?: number;
  unit?: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  radius?: "lg" | "xl" | "2xl";
}

/**
 * Hero score readout — big numeral, colored band, delta chip, plain-language description.
 * The Heart Health Score / Energy Score pattern.
 * @startingPoint section="Health data" subtitle="Hero score card with band + delta" viewport="480x300"
 */
export function ScoreCard(props: ScoreCardProps): JSX.Element;
