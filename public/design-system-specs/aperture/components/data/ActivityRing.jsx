import React from "react";

/** Concentric activity rings (Move/Exercise/Stand style).
 *  rings: [{ value, max, color }] — outermost first. */
export function ActivityRing({ rings = [], size = 120, thickness = 12, gap = 4, style, ...rest }) {
  const center = size / 2;
  return (
    <svg width={size} height={size} style={{ ...style }} {...rest}>
      <g transform={`rotate(-90 ${center} ${center})`}>
        {rings.map((ring, i) => {
          const r = center - thickness / 2 - i * (thickness + gap);
          if (r <= 0) return null;
          const c = 2 * Math.PI * r;
          const pct = Math.max(0, Math.min(1, ring.value / ring.max));
          const dash = c * pct;
          return (
            <g key={i}>
              <circle cx={center} cy={center} r={r} fill="none"
                stroke={ring.track || "var(--surface-sunken)"} strokeWidth={thickness} />
              <circle cx={center} cy={center} r={r} fill="none" stroke={ring.color} strokeWidth={thickness}
                strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`}
                style={{ transition: "stroke-dasharray var(--dur-ring) var(--ease-out)" }} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
