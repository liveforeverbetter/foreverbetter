import React from "react";

/** Centered modal (desktop) / bottom sheet (mobile via `sheet`). Renders its own scrim.
 *  Uncontrolled visibility handled by parent (render only when open). */
export function Modal({ title, subtitle, children, actions, onClose, sheet = false, width = 440, style, ...rest }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex",
        alignItems: sheet ? "flex-end" : "center", justifyContent: "center",
        background: "rgba(14,16,19,0.38)", backdropFilter: "blur(2px)", padding: sheet ? 0 : 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: sheet ? "100%" : width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto",
          background: "var(--surface-card)",
          borderRadius: sheet ? "var(--radius-2xl) var(--radius-2xl) 0 0" : "var(--radius-2xl)",
          padding: 24, boxShadow: "var(--shadow-pop)",
          animation: `${sheet ? "apSheet" : "apPop"} var(--dur-slow) var(--ease-out)`, ...style,
        }}
        {...rest}
      >
        {sheet && <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--border-strong)", margin: "-6px auto 16px" }} />}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            {title && <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)",
              fontSize: "var(--fs-h2)", letterSpacing: "var(--tracking-tight)" }}>{title}</h2>}
            {subtitle && <p style={{ margin: "6px 0 0", fontSize: "var(--fs-body-sm)", color: "var(--text-tertiary)" }}>{subtitle}</p>}
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "var(--surface-hover)",
              width: 34, height: 34, borderRadius: "var(--radius-full)", cursor: "pointer", color: "var(--text-secondary)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 34px" }}>
              <span style={{ width: 18, height: 18, display: "inline-flex" }}><i data-lucide="x"></i></span>
            </button>
          )}
        </div>
        <div style={{ marginTop: title ? 18 : 0 }}>{children}</div>
        {actions && <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>{actions}</div>}
      </div>
      <style>{`@keyframes apPop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}@keyframes apSheet{from{transform:translateY(100%)}to{transform:none}}`}</style>
    </div>
  );
}
