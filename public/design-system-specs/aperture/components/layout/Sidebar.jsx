import React from "react";

/** Desktop dashboard sidebar. brand string + nav items + optional footer node.
 *  items: [{ id, label, icon, badge }]. Sections via items with `section: true`. */
export function Sidebar({ brand = "Aperture", items = [], active, onSelect, footer, style, ...rest }) {
  return (
    <aside style={{
      display: "flex", flexDirection: "column", width: "var(--sidebar-w)", flex: "0 0 var(--sidebar-w)",
      height: "100%", padding: "22px 16px", boxSizing: "border-box",
      background: "var(--surface-card)", borderRight: "1px solid var(--border-subtle)", ...style,
    }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px 22px" }}>
        <span style={{
          width: 30, height: 30, borderRadius: 9, display: "inline-flex", alignItems: "center",
          justifyContent: "center", background: "var(--grad-brand)", color: "#fff", flex: "0 0 30px",
        }}>
          <span style={{ width: 17, height: 17, display: "inline-flex" }}><i data-lucide="aperture"></i></span>
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-xbold)", fontSize: 19, letterSpacing: "var(--tracking-tight)" }}>{brand}</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {items.map((it) => {
          if (it.section) return <div key={it.label} style={{ padding: "16px 12px 6px", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-muted)" }}>{it.label}</div>;
          const on = it.id === active;
          return (
            <button key={it.id} onClick={() => onSelect && onSelect(it.id)}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 12px",
                border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                fontFamily: "var(--font-body)", fontSize: "var(--fs-body-sm)", fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
                background: on ? "var(--brand-soft)" : "transparent",
                color: on ? "var(--text-brand)" : "var(--text-secondary)",
                transition: "background var(--dur-fast) var(--ease-out)",
              }}>
              <span style={{ display: "inline-flex", width: 19, height: 19 }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge != null && (
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                  background: on ? "var(--teal-100)" : "var(--ink-100)", color: on ? "var(--teal-700)" : "var(--text-tertiary)",
                  borderRadius: "var(--radius-full)", padding: "1px 8px" }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      {footer && <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>{footer}</div>}
    </aside>
  );
}
