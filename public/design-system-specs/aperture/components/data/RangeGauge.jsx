import React from "react";

/** Horizontal range gauge with an optimal band and a marker at `value` (0–1).
 *  Used for cardio load, vascular load, "balanced / injury risk" style readouts. */
export function RangeGauge({
  value = 0.5, band = [0.35, 0.7], leftLabel, rightLabel, status, statusTone = "good",
  height = 12, style, ...rest
}) {
  const pos = Math.max(0, Math.min(1, value)) * 100;
  const b0 = Math.max(0, Math.min(1, band[0])) * 100;
  const b1 = Math.max(0, Math.min(1, band[1])) * 100;
  return (
    <div style={{ ...style }} {...rest}>
      {status && (
        <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h3)",
          color: `var(--score-${statusTone})`, marginBottom: 10 }}>{status}</div>
      )}
      <div style={{ position: "relative", height, borderRadius: "var(--radius-full)", background: "var(--surface-sunken)" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${b0}%`, width: `${b1 - b0}%`,
          borderRadius: "var(--radius-full)",
          background: "repeating-linear-gradient(45deg, var(--ink-200) 0 4px, var(--ink-100) 4px 8px)" }} />
        <div style={{ position: "absolute", top: "50%", left: `${pos}%`, transform: "translate(-50%,-50%)",
          width: height + 6, height: height + 6, borderRadius: "var(--radius-full)",
          background: `var(--score-${statusTone})`, border: "3px solid var(--surface-card)", boxShadow: "var(--shadow-sm)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8,
        fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}
