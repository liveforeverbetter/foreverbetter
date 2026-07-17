import * as React from 'react';
export type DayState = 'complete' | 'missed' | 'today' | 'partial' | 'upcoming';
export interface JournalDay { label: string; state: DayState; }
export interface JournalWeekProps {
  days?: JournalDay[];
  style?: React.CSSProperties;
}
/** Day-of-week completion strip of status dots. */
export function JournalWeek(props: JournalWeekProps): JSX.Element;
