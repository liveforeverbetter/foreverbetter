import * as React from "react";

export interface InsightBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  icon?: React.ReactNode;
  /** Domain tone (teal, sleep, activity, nutrition, mind, vitals, heart). */
  tone?: string;
  /** Optional gradient background (var(--grad-*)) overriding tone. */
  gradient?: string;
  glow?: boolean;
  /** Carousel dot count. */
  dots?: number;
  activeDot?: number;
  action?: React.ReactNode;
}

/**
 * The big conversational insight card — AI-written, second-person guidance at the top of a screen.
 * @startingPoint section="Health data" subtitle="Conversational AI insight banner" viewport="480x260"
 */
export function InsightBanner(props: InsightBannerProps): JSX.Element;
