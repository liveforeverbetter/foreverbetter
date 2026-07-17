import * as React from 'react';
export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  onChange?: (checked: boolean) => void;
  style?: React.CSSProperties;
}
/** Square control with mint fill + check when selected. */
export function Checkbox(props: CheckboxProps): JSX.Element;
