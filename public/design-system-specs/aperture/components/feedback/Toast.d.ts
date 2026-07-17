import * as React from "react";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "good" | "fair" | "attention" | "excellent" | "success" | "warning" | "danger" | "info";
  title: React.ReactNode;
  message?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

/** Brief, non-blocking feedback toast. */
export function Toast(props: ToastProps): JSX.Element;
