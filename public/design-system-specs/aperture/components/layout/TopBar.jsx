import React from "react";

/** App top bar — optional back button, title, and trailing action nodes. */
export function TopBar({ title, onBack, leading, actions, large = false, style, ...rest }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: 12,
      height: "var(--topbar-h)", padding: "0 var(--gutter-app)",
      background: "transparent", ...style,
    }} {...rest}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 38, height: 38, marginLeft: -6, border: "none", background: "transparent",
          color: "var(--text-primary)", cursor: "pointer", borderRadius: "var(--radius-full)",
        }}>
          <span style={{ width: 22, height: 22, display: "inline-flex" }}><i data-lucide="chevron-left"></i></span>
        </button>
      )}
      {leading}
      <h1 style={{
        margin: 0, flex: 1, fontFamily: "var(--font-display)",
        fontWeight: "var(--fw-bold)", letterSpacing: "var(--tracking-tight)",
        fontSize: large ? "var(--fs-h1)" : "var(--fs-h3)", color: "var(--text-primary)",
      }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{actions}</div>
    </header>
  );
}
