import * as React from "react";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "excellent" | "good" | "fair" | "attention" | "success" | "warning" | "danger" | "info";
  variant?: "soft" | "solid" | "outline";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/** Status pill / badge — "Good", "High", "Out of range". Soft by default. */
export function StatusPill(props: StatusPillProps): JSX.Element;
