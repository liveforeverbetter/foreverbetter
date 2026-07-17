import * as React from 'react';
export interface StatusBannerProps {
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  onClose?: () => void;
  style?: React.CSSProperties;
}
/** Full-width inline notice — dashboard insight / alert strip. */
export function StatusBanner(props: StatusBannerProps): JSX.Element;
