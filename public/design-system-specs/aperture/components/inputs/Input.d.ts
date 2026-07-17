import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  wrapStyle?: React.CSSProperties;
}

/** Text input with label, optional leading icon, hint/error, and a teal focus ring. */
export function Input(props: InputProps): JSX.Element;
