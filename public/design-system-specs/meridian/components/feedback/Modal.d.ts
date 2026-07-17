import * as React from 'react';
export interface ModalProps {
  open?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
  style?: React.CSSProperties;
}
/** Centered dialog on a blurred scrim. */
export function Modal(props: ModalProps): JSX.Element | null;
