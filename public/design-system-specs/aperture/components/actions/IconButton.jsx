import React from "react";
import { pressScale } from "./motion.js";

const SIZES = { sm: 34, md: 42, lg: 52 };

export function IconButton({
  variant = "ghost", size = "md", label, children, active = false, disabled = false, style, onClick, ...rest
}) {
  const dim = SIZES[size] || SIZES.md;
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const tones = {
    ghost:   { bg: "transparent", fg: "var(--text-secondary)", hover: "var(--surface-hover)" },
    soft:    { bg: "var(--brand-soft)", fg: "var(--text-brand)", hover: "var(--teal-100)" },
    solid:   { bg: "var(--ink-900)", fg: "#fff", hover: "var(--ink-800)" },
    outline: { bg: "var(--surface-card)", fg: "var(--text-secondary)", hover: "var(--surface-hover)" },
  };
  const t = tones[variant] || tones.ghost;
  return (
    <button
      type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: dim, height: dim, flex: `0 0 ${dim}px`,
        color: active ? "var(--text-brand)" : t.fg,
        background: active ? "var(--brand-soft)" : hover ? t.hover : t.bg,
        border: variant === "outline" ? "1.5px solid var(--border-default)" : "1.5px solid transparent",
        borderRadius: "var(--radius-full)", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transform: pressScale(pressed && !disabled, 0.94),
        transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: "inline-flex", width: dim * 0.44, height: dim * 0.44 }}>{children}</span>
    </button>
  );
}
