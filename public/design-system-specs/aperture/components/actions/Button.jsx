import React from "react";
import { pressScale } from "./motion.js";

const SIZES = {
  sm: { height: 34, padding: "0 14px", font: "var(--fs-label)", radius: "var(--radius-sm)", gap: 6 },
  md: { height: 42, padding: "0 18px", font: "var(--fs-body-sm)", radius: "var(--radius-md)", gap: 8 },
  lg: { height: 52, padding: "0 24px", font: "var(--fs-body)", radius: "var(--radius-md)", gap: 8 },
};

function palette(variant) {
  switch (variant) {
    case "primary":
      return { bg: "var(--btn-primary-bg)", fg: "var(--btn-primary-fg)", border: "transparent",
               hoverBg: "var(--btn-primary-bg-hover)", activeBg: "var(--btn-primary-bg-active)" };
    case "brand":
      return { bg: "var(--brand)", fg: "#fff", border: "transparent",
               hoverBg: "var(--brand-hover)", activeBg: "var(--brand-active)" };
    case "secondary":
      return { bg: "var(--surface-card)", fg: "var(--text-primary)", border: "var(--border-default)",
               hoverBg: "var(--surface-hover)", activeBg: "var(--brand-soft)" };
    case "soft":
      return { bg: "var(--brand-soft)", fg: "var(--text-brand)", border: "transparent",
               hoverBg: "var(--teal-100)", activeBg: "var(--teal-100)" };
    case "danger":
      return { bg: "var(--danger-500)", fg: "#fff", border: "transparent",
               hoverBg: "var(--danger-600)", activeBg: "var(--danger-700)" };
    case "ghost":
    default:
      return { bg: "transparent", fg: "var(--text-secondary)", border: "transparent",
               hoverBg: "var(--surface-hover)", activeBg: "var(--ink-100)" };
  }
}

export function Button({
  variant = "primary", size = "md", icon, iconRight, fullWidth = false,
  disabled = false, children, style, onClick, ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const p = palette(variant);
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const bg = disabled ? "var(--ink-100)" : active ? p.activeBg : hover ? p.hoverBg : p.bg;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: s.gap,
        height: s.height, padding: s.padding, width: fullWidth ? "100%" : "auto",
        font: "inherit", fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)",
        fontSize: s.font, lineHeight: 1, whiteSpace: "nowrap",
        color: disabled ? "var(--text-muted)" : p.fg,
        background: bg,
        border: `1.5px solid ${p.border === "transparent" ? bg : p.border}`,
        borderRadius: s.radius, cursor: disabled ? "not-allowed" : "pointer",
        transform: pressScale(active && !disabled, 0.97),
        transition: "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: "inline-flex", width: "1.15em", height: "1.15em" }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: "inline-flex", width: "1.15em", height: "1.15em" }}>{iconRight}</span>}
    </button>
  );
}
