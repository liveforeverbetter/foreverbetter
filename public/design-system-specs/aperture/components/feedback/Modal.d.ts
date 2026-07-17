import * as React from "react";

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer action buttons. */
  actions?: React.ReactNode;
  onClose?: () => void;
  /** Render as a bottom sheet (mobile). */
  sheet?: boolean;
  width?: number;
}

/** Centered modal / bottom sheet with its own scrim. Render only when open. */
export function Modal(props: ModalProps): JSX.Element;
