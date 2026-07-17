import React from "react";

/** Circular progress ring (SVG). Center content passed as children. */
export function ProgressRing({
  value = 0, max = 100, size = 96, thickness = 10, color = "var(--brand)",
  track = "var(--surface-sunken)", rounded = true, children, style, ...rest
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = c * pct;
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }} {...rest}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeLinecap={rounded ? "round" : "butt"} strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: "stroke-dasharray var(--dur-ring) var(--ease-out)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}
