import * as React from 'react';
export interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  onChange?: (checked: boolean) => void;
  style?: React.CSSProperties;
}
/** Binary toggle; on-state fills mint. */
export function Switch(props: SwitchProps): JSX.Element;
