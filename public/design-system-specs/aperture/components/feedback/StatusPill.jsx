import React from "react";

const TONES = {
  excellent: "excellent", good: "good", fair: "fair", attention: "attention",
  success: "good", warning: "fair", danger: "attention", info: "excellent",
};

/** Small status pill / badge. tone maps to score/semantic colors. */
export function StatusPill({
  tone = "good", variant = "soft", size = "md", icon, children, style, ...rest
}) {
  const key = TONES[tone] || "good";
  const fg = `var(--score-${key})`;
  const bg = `var(--score-${key}-bg)`;
  const sz = size === "sm"
    ? { fontSize: "var(--fs-micro)", padding: "2px 8px", gap: 4 }
    : { fontSize: "var(--fs-caption)", padding: "3px 10px", gap: 5 };
  const styles = variant === "solid"
    ? { background: fg, color: "#fff", border: "1px solid transparent" }
    : variant === "outline"
    ? { background: "transparent", color: fg, border: `1.5px solid ${fg}` }
    : { background: bg, color: fg, border: "1px solid transparent" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: sz.gap, padding: sz.padding,
      fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)", fontSize: sz.fontSize,
      lineHeight: 1, borderRadius: "var(--radius-full)", whiteSpace: "nowrap", ...styles, ...style,
    }} {...rest}>
      {icon && <span style={{ display: "inline-flex", width: "1em", height: "1em" }}>{icon}</span>}
      {children}
    </span>
  );
}
