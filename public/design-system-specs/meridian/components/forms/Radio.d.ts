import * as React from 'react';
export interface RadioProps {
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export interface RadioOption { value: string; label: string; description?: string; }
export interface RadioGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: (string | RadioOption)[];
  name?: string;
  gap?: number;
  style?: React.CSSProperties;
}
/** Single-select circular control. */
export function Radio(props: RadioProps): JSX.Element;
/** Vertical group of radios bound to one value. */
export function RadioGroup(props: RadioGroupProps): JSX.Element;
