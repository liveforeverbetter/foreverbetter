import * as React from 'react';
export interface SelectOption { value: string; label: string; }
export interface SelectProps {
  label?: string;
  hint?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: (string | SelectOption)[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: React.CSSProperties;
}
/** Native-backed select with styled chrome and chevron. */
export function Select(props: SelectProps): JSX.Element;
