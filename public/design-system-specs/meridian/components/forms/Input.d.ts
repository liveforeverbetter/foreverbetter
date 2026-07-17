import * as React from 'react';
/** Dark inset text field with label, hint & error states. */
export interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}
/** Dark inset text field with label, hint & error states. */
export function Input(props: InputProps): JSX.Element;
