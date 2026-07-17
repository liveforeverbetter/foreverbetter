import React from "react";

/** Text input with optional label, leading icon, hint, and error. */
export function Input({
  label, icon, hint, error, id, style, wrapStyle, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const rid = id || React.useId();
  const border = error ? "var(--danger-500)" : focus ? "var(--border-brand)" : "var(--border-default)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapStyle }}>
      {label && <label htmlFor={rid} style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-medium)", color: "var(--text-secondary)" }}>{label}</label>}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 14px",
        background: "var(--surface-card)", border: `1.5px solid ${border}`, borderRadius: "var(--radius-md)",
        boxShadow: focus ? "0 0 0 3px var(--focus-ring)" : "none",
        transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
      }}>
        {icon && <span style={{ display: "inline-flex", width: 18, height: 18, color: "var(--text-muted)" }}>{icon}</span>}
        <input id={rid} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: "var(--font-body)", fontSize: "var(--fs-body-sm)", color: "var(--text-primary)",
            minWidth: 0, ...style }} {...rest} />
      </div>
      {(hint || error) && <span style={{ fontSize: "var(--fs-caption)", color: error ? "var(--danger-600)" : "var(--text-muted)" }}>{error || hint}</span>}
    </div>
  );
}
