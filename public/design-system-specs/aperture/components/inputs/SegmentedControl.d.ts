import * as React from "react";

export interface SegmentOption { id: string; label?: string; icon?: React.ReactNode; }
export interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentOption[];
  value?: string;
  onChange?: (id: string) => void;
  size?: "sm" | "md";
  /** Icon-only pills (the app's top domain-tab row). */
  iconOnly?: boolean;
}

/** Segmented control / pill tabs — time ranges and the app's icon-tab navigation row. */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
