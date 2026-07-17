import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `primary` = ink CTA, `brand` = teal, `soft` = tinted brand, `secondary` = outlined, `ghost` = bare, `danger` = red. */
  variant?: "primary" | "brand" | "secondary" | "soft" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Leading icon node (e.g. a Lucide <i> or svg). */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Primary interactive button for Aperture. Sentence-case labels, no exclamation.
 * @startingPoint section="Actions" subtitle="Buttons — 6 variants × 3 sizes" viewport="700x220"
 */
export function Button(props: ButtonProps): JSX.Element;
