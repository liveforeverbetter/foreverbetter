import React from "react";

/** Hero score readout: big numeral, colored band label, delta chip, optional description.
 *  Renders its own tinted surface. */
export function ScoreCard({
  score, max = 100, band, tone = "good", delta, unit, description, footer,
  radius = "xl", style, ...rest
}) {
  const toneC = `var(--score-${tone})`;
  return (
    <div style={{
      background: `var(--score-${tone}-bg)`, color: "var(--text-primary)",
      borderRadius: `var(--radius-${radius})`, padding: 24, boxShadow: "var(--shadow-card)", ...style,
    }} {...rest}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-xbold)",
          fontSize: "var(--fs-score)", lineHeight: 1, letterSpacing: "var(--tracking-tight)" }}>
          {score}{unit && <span style={{ fontSize: "var(--fs-h3)", fontWeight: "var(--fw-semibold)", color: "var(--text-tertiary)", marginLeft: 4 }}>{unit}</span>}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 6 }}>
          {delta != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, alignSelf: "flex-start",
              fontFamily: "var(--font-mono)", fontSize: "var(--fs-caption)", fontWeight: 700,
              color: delta >= 0 ? "var(--success-600)" : "var(--danger-600)",
              background: "var(--surface-card)", borderRadius: "var(--radius-full)", padding: "2px 8px" }}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
            </span>
          )}
          {band && <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-h3)", color: toneC }}>{band}</span>}
        </div>
      </div>
      {description && <p style={{ margin: "14px 0 0", fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>{description}</p>}
      {footer}
    </div>
  );
}
