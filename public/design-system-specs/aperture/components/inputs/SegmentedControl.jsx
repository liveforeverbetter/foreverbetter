import React from "react";

/** Segmented control / pill tabs. options: [{id,label,icon}] or [{id,icon}] for icon-only.
 *  Used for time-range toggles (Day/Week/Month) and the app's top icon-tab row. */
export function SegmentedControl({
  options = [], value, onChange, size = "md", iconOnly = false, style, ...rest
}) {
  const pad = size === "sm" ? "6px 12px" : "9px 16px";
  return (
    <div role="tablist" style={{
      display: "inline-flex", gap: 4, padding: 4, background: "var(--surface-sunken)",
      borderRadius: "var(--radius-full)", ...style,
    }} {...rest}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} role="tab" aria-selected={on} aria-label={o.label}
            onClick={() => onChange && onChange(o.id)}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: iconOnly ? 0 : pad, width: iconOnly ? (size === "sm" ? 34 : 40) : "auto",
              height: iconOnly ? (size === "sm" ? 34 : 40) : "auto",
              border: "none", borderRadius: "var(--radius-full)", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: "var(--fs-label)", fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
              background: on ? "var(--surface-card)" : "transparent",
              color: on ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: on ? "var(--shadow-xs)" : "none",
              transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
            }}>
            {o.icon && <span style={{ display: "inline-flex", width: 18, height: 18 }}>{o.icon}</span>}
            {!iconOnly && o.label}
          </button>
        );
      })}
    </div>
  );
}
