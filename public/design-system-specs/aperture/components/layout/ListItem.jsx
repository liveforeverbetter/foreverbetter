import React from "react";

/** A single row: leading icon chip, title/subtitle, trailing value + chevron. */
export function ListItem({
  icon, iconTone = "teal", title, subtitle, value, valueUnit, trailing,
  chevron = false, onClick, divider = false, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const toneVar = `var(--${iconTone}-500)`;
  const toneBg = `var(--${iconTone}-50)`;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 8px", borderRadius: "var(--radius-md)",
        background: (onClick && hover) ? "var(--surface-hover)" : "transparent",
        borderBottom: divider ? "1px solid var(--border-subtle)" : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "background var(--dur-fast) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      {icon && (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, flex: "0 0 40px", borderRadius: "var(--radius-full)",
          background: toneBg, color: toneVar,
        }}>
          <span style={{ display: "inline-flex", width: 20, height: 20 }}>{icon}</span>
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-body-sm)", color: "var(--text-primary)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: "var(--fs-label)", color: "var(--text-tertiary)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {value != null && (
        <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: "var(--fw-semibold)", color: "var(--text-primary)" }}>
          {value}{valueUnit && <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginLeft: 3 }}>{valueUnit}</span>}
        </div>
      )}
      {trailing}
      {chevron && (
        <span style={{ display: "inline-flex", width: 18, height: 18, color: "var(--text-muted)" }}>
          <i data-lucide="chevron-right"></i>
        </span>
      )}
    </div>
  );
}
