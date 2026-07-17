import * as React from 'react';
export interface TabBarItem { value: string; label: string; icon: 'home' | 'overview' | 'plan' | 'genetics' | 'biomarkers' | 'wearables' | 'health' | 'community' | 'more' | 'trends'; }
export interface TabBarOrb { glyph?: string; label?: string; onClick?: () => void; }
/** Mobile bottom navigation with a floating brand orb action.
 * @startingPoint section="Navigation" subtitle="Mobile bottom tab bar" viewport="390x96" */
export interface TabBarProps {
  items?: TabBarItem[];
  value?: string;
  onChange?: (value: string) => void;
  orb?: TabBarOrb;
  style?: React.CSSProperties;
}
/** Mobile bottom navigation with a floating brand orb action. */
export function TabBar(props: TabBarProps): JSX.Element;
