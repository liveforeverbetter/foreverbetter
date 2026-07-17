import * as React from 'react';
export interface ToastProps {
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  title?: React.ReactNode;
  message?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export interface StatusGlyphProps { kind?: 'check' | 'alert' | 'info'; size?: number; }
/** Brief, non-blocking feedback card. */
export function Toast(props: ToastProps): JSX.Element;
export function StatusGlyph(props: StatusGlyphProps): JSX.Element;
