import React from "react";

/** Compact metric tile: label, big value + unit, and a status pill.
 *  The workhorse of grid dashboards (heart-health sub-metrics, biomarker panels). */
export function MetricTile({
  label, value, unit, status, statusTone = "good", icon, iconTone = "teal",
  hint, onClick, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 10,
        background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)", padding: 16, minWidth: 0,
        boxShadow: hover && onClick ? "var(--shadow-card)" : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow var(--dur-base) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && (
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: "var(--radius-full)",
            background: `var(--${iconTone}-50)`, color: `var(--${iconTone}-500)` }}>
            <span style={{ width: 15, height: 15, display: "inline-flex" }}>{icon}</span>
          </span>
        )}
        <span style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-medium)", color: "var(--text-tertiary)",
          lineHeight: 1.25, textWrap: "pretty" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)",
          color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>{value}</span>
        {unit && <span style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" }}>{unit}</span>}
      </div>
      {status && (
        <span style={{ alignSelf: "flex-start", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-semibold)",
          color: `var(--score-${statusTone})`, background: `var(--score-${statusTone}-bg)`,
          borderRadius: "var(--radius-sm)", padding: "2px 8px" }}>{status}</span>
      )}
      {hint && <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}
