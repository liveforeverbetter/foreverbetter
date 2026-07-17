import * as React from "react";

export interface TabBarItem { id: string; label: string; icon: React.ReactNode; }
export interface TabBarProps extends React.HTMLAttributes<HTMLElement> {
  items: TabBarItem[];
  active?: string;
  onSelect?: (id: string) => void;
}

/** Floating pill bottom navigation for the mobile app. */
export function TabBar(props: TabBarProps): JSX.Element;
