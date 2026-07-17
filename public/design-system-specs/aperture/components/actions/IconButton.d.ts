import * as React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "soft" | "solid" | "outline";
  size?: "sm" | "md" | "lg";
  /** Accessible label (also used as tooltip). */
  label: string;
  /** Active/selected state — applies brand tint. */
  active?: boolean;
  disabled?: boolean;
  /** Icon node. */
  children?: React.ReactNode;
}

/** Circular icon-only button — nav actions, card overflow, back buttons. */
export function IconButton(props: IconButtonProps): JSX.Element;
