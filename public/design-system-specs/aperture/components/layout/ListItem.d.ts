import * as React from "react";

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  /** Tone name for the leading icon chip (teal, sleep, activity, nutrition, mind, vitals, heart). */
  iconTone?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Trailing metric value (monospace). */
  value?: React.ReactNode;
  valueUnit?: string;
  trailing?: React.ReactNode;
  chevron?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

/** A metric/navigation row with a tinted leading icon chip and a trailing value or chevron. */
export function ListItem(props: ListItemProps): JSX.Element;
