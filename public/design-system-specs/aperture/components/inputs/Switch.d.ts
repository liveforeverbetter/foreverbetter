import * as React from "react";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

/** On/off toggle switch, controlled. */
export function Switch(props: SwitchProps): JSX.Element;
