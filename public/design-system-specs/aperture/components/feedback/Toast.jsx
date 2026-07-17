import React from "react";

/** Brief non-blocking toast. tone-colored leading dot/icon, title, optional message + action. */
export function Toast({ tone = "good", title, message, icon, action, onDismiss, style, ...rest }) {
  const key = ({ success: "good", warning: "fair", danger: "attention", info: "excellent" })[tone] || tone;
  return (
    <div role="status" style={{
      display: "flex", alignItems: "flex-start", gap: 12, width: 360, maxWidth: "100%",
      background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)", padding: "14px 16px", boxShadow: "var(--shadow-pop)",
      animation: "apToastIn var(--dur-slow) var(--ease-out)", ...style,
    }} {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, flex: "0 0 28px", borderRadius: "var(--radius-full)",
        background: `var(--score-${key}-bg)`, color: `var(--score-${key})` }}>
        <span style={{ width: 16, height: 16, display: "inline-flex" }}>{icon || <i data-lucide="check"></i>}</span>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-body-sm)", color: "var(--text-primary)" }}>{title}</div>
        {message && <div style={{ fontSize: "var(--fs-label)", color: "var(--text-tertiary)", marginTop: 2 }}>{message}</div>}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" style={{ border: "none", background: "transparent",
          color: "var(--text-muted)", cursor: "pointer", padding: 2, display: "inline-flex" }}>
          <span style={{ width: 16, height: 16, display: "inline-flex" }}><i data-lucide="x"></i></span>
        </button>
      )}
      <style>{`@keyframes apToastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){@keyframes apToastIn{from{opacity:0}to{opacity:1}}}`}</style>
    </div>
  );
}
