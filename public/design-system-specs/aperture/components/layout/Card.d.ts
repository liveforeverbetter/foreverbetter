import * as React from "react";

export type CardTone = "none" | "teal" | "sleep" | "activity" | "nutrition" | "mind" | "vitals" | "heart"
  | "excellent" | "good" | "fair" | "attention";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Background/foreground tint. `none` = white surface; domain + score tones apply soft pastel washes. */
  tone?: CardTone;
  radius?: "md" | "lg" | "xl";
  /** Inner padding. Number (px) or preset. */
  padding?: "sm" | "md" | "lg" | number;
  /** Apply the signature teal aura glow (for featured/insight cards). */
  glow?: boolean;
  /** Lift on hover. */
  interactive?: boolean;
  /** CSS gradient string to override the tone background (use var(--grad-*)). */
  gradient?: string;
  children?: React.ReactNode;
}

/**
 * Foundational surface — rounded, soft-shadowed. The building block of every Aperture screen.
 * @startingPoint section="Layout" subtitle="Card surfaces — tones, gradient, glow" viewport="700x300"
 */
export function Card(props: CardProps): JSX.Element;
