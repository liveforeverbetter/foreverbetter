import React from "react";

/** Lightweight SVG area chart with gradient fill and an optional target band.
 *  data: number[]. Renders on a 0-based value axis. */
export function AreaChart({
  data = [], color = "var(--brand)", fillOpacity = 0.16, height = 160,
  min, max, targetBand, xLabels, yTicks = 3, smooth = true, style, ...rest
}) {
  const W = 320, H = 140, padL = 4, padR = 4, padT = 8, padB = 4;
  const lo = min != null ? min : Math.min(0, ...data);
  const hi = max != null ? max : Math.max(1, ...data) * 1.1;
  const gid = React.useMemo(() => "ac" + Math.random().toString(36).slice(2, 8), []);
  const xs = data.map((_, i) => padL + (i / Math.max(1, data.length - 1)) * (W - padL - padR));
  const ys = data.map((v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB));
  const pts = xs.map((x, i) => [x, ys[i]]);

  const line = smooth ? smoothPath(pts) : pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const area = line + ` L ${xs[xs.length - 1]} ${H - padB} L ${xs[0]} ${H - padB} Z`;

  const bandY = targetBand ? [
    padT + (1 - (targetBand[1] - lo) / (hi - lo)) * (H - padT - padB),
    padT + (1 - (targetBand[0] - lo) / (hi - lo)) * (H - padT - padB),
  ] : null;

  return (
    <div style={{ ...style }} {...rest}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(yTicks)].map((_, i) => {
          const y = padT + (i / (yTicks - 1)) * (H - padT - padB);
          return <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border-subtle)" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
        })}
        {bandY && <rect x={padL} y={bandY[0]} width={W - padL - padR} height={Math.max(2, bandY[1] - bandY[0])}
          fill="var(--ink-200)" opacity="0.5" />}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {xLabels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
          {xLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

function smoothPath(pts) {
  if (pts.length < 2) return pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}
