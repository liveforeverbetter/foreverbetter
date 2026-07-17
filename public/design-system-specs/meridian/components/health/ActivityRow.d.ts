import * as React from 'react';
export interface ActivityRowProps {
  icon?: 'moon' | 'activity' | 'heart' | 'run';
  channel?: 'sleep' | 'strain' | 'recovery' | 'stress';
  duration?: React.ReactNode;
  label?: React.ReactNode;
  start?: string;
  end?: string;
  meta?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Logged/planned activity chip with a colored time badge. */
export function ActivityRow(props: ActivityRowProps): JSX.Element;
