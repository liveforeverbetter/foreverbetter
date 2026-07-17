import React from "react";

/** Mobile bottom tab bar. items: [{ id, label, icon }]. Floating pill style. */
export function TabBar({ items = [], active, onSelect, style, ...rest }) {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-around",
      gap: 4, height: 60, padding: "0 10px", margin: "0 16px 14px",
      background: "var(--surface-card)", borderRadius: "var(--radius-full)",
      boxShadow: "var(--shadow-raised)", ...style,
    }} {...rest}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} onClick={() => onSelect && onSelect(it.id)} aria-label={it.label}
            style={{
              display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, flex: 1, height: 48, border: "none", background: "transparent", cursor: "pointer",
              color: on ? "var(--text-brand)" : "var(--text-muted)",
              transition: "color var(--dur-fast) var(--ease-out)",
            }}>
            <span style={{ display: "inline-flex", width: 22, height: 22 }}>{it.icon}</span>
            <span style={{ fontSize: 10.5, fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)" }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
