import React from "react";

/** On/off switch. Controlled via checked + onChange. */
export function Switch({ checked = false, onChange, disabled = false, size = "md", style, ...rest }) {
  const dims = size === "sm" ? { w: 38, h: 22, k: 16 } : { w: 46, h: 27, k: 21 };
  return (
    <button
      type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{
        position: "relative", width: dims.w, height: dims.h, flex: `0 0 ${dims.w}px`, padding: 0, border: "none",
        borderRadius: "var(--radius-full)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        background: checked ? "var(--brand)" : "var(--ink-200)",
        transition: "background var(--dur-base) var(--ease-out)", ...style,
      }}
      {...rest}
    >
      <span style={{
        position: "absolute", top: (dims.h - dims.k) / 2, left: checked ? dims.w - dims.k - (dims.h - dims.k) / 2 : (dims.h - dims.k) / 2,
        width: dims.k, height: dims.k, borderRadius: "var(--radius-full)", background: "#fff",
        boxShadow: "var(--shadow-sm)", transition: "left var(--dur-base) var(--ease-out)",
      }} />
    </button>
  );
}
