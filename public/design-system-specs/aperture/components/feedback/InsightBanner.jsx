import React from "react";

/** The big conversational insight card ("Incredible yesterday!", "Heart signals under pressure").
 *  Gradient or tinted surface, optional leading icon cluster, title, body, and carousel dots. */
export function InsightBanner({
  eyebrow, title, body, icon, tone = "teal", gradient, glow = false,
  dots, activeDot = 0, action, style, ...rest
}) {
  const bg = gradient || `var(--${tone}-50)`;
  return (
    <div style={{
      position: "relative", background: bg, borderRadius: "var(--radius-2xl)", padding: 22,
      boxShadow: glow ? "var(--aura-teal)" : "var(--shadow-card)", overflow: "hidden", ...style,
    }} {...rest}>
      {icon && (
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 44, height: 44, borderRadius: "var(--radius-lg)", marginBottom: 14,
          background: `var(--${tone}-500)`, color: "#fff" }}>
          <span style={{ width: 22, height: 22, display: "inline-flex" }}>{icon}</span>
        </div>
      )}
      {eyebrow && <div style={{ fontSize: "var(--fs-caption)", fontWeight: 700, letterSpacing: ".04em",
        textTransform: "uppercase", color: `var(--${tone}-700)`, marginBottom: 6 }}>{eyebrow}</div>}
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)",
        fontSize: "var(--fs-h2)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{title}</h3>
      {body && <p style={{ margin: "10px 0 0", fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)",
        color: "var(--text-secondary)" }}>{body}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
      {dots != null && (
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {[...Array(dots)].map((_, i) => (
            <span key={i} style={{ width: i === activeDot ? 18 : 6, height: 6, borderRadius: 999,
              background: i === activeDot ? `var(--${tone}-500)` : `var(--${tone}-200, var(--ink-200))`,
              transition: "width var(--dur-base) var(--ease-out)" }} />
          ))}
        </div>
      )}
    </div>
  );
}
