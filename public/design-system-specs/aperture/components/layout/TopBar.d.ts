import * as React from "react";

export interface TopBarProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  /** Show a back chevron and handle its click. */
  onBack?: () => void;
  leading?: React.ReactNode;
  /** Trailing action nodes (IconButtons). */
  actions?: React.ReactNode;
  /** Large display title (screen headers). */
  large?: boolean;
}

/** Transparent app top bar — back button, title, trailing actions. */
export function TopBar(props: TopBarProps): JSX.Element;
