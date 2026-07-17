import React from 'react';

const channels = {
  recovery: 'var(--metric-recovery)', strain: 'var(--metric-strain)',
  sleep: 'var(--metric-sleep)', stress: 'var(--metric-stress)', brand: 'var(--brand)',
};

/**
 * Meridian TrendChart — the system's time-series visual. A smooth line with a
 * fading area fill, an optional highlighted last point, an optimal band, and
 * min/max/axis labels. Colored per health channel. Pure SVG, responsive.
 */
export function TrendChart({
  data = [], channel = 'recovery', height = 140, min, max,
  band, labels, showDots = false, showArea = true, showLast = true,
  valueFormat = (v) => v, style,
}) {
  const vals = data.map(d => (typeof d === 'number' ? d : d.value));
  const lo = min != null ? min : Math.min(...vals);
  const hi = max != null ? max : Math.max(...vals);
  const span = hi - lo || 1;
  const W = 100, H = 100, pad = 6;
  const c = channels[channel] || channels.recovery;
  const uid = React.useId ? React.useId().replace(/:/g, '') : 'mrd' + channel;

  const pts = vals.map((v, i) => {
    const x = vals.length > 1 ? pad + (i / (vals.length - 1)) * (W - pad * 2) : W / 2;
    const y = H - pad - ((v - lo) / span) * (H - pad * 2);
    return [x, y];
  });

  // Smooth path (catmull-rom → bezier).
  const line = pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const p0 = a[i - 1], p1 = p;
    const cx = (p0[0] + p1[0]) / 2;
    return acc + ` C ${cx} ${p0[1]} ${cx} ${p1[1]} ${p1[0]} ${p1[1]}`;
  }, '');
  const area = line + ` L ${pts[pts.length - 1][0]} ${H - pad} L ${pts[0][0]} ${H - pad} Z`;
  const last = pts[pts.length - 1];
  const bandTop = band ? H - pad - ((band[1] - lo) / span) * (H - pad * 2) : 0;
  const bandBot = band ? H - pad - ((band[0] - lo) / span) * (H - pad * 2) : 0;

  return (
    <div style={{ width: '100%', ...style }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`fill${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.30" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        {band && <rect x="0" y={bandTop} width={W} height={Math.max(0, bandBot - bandTop)} fill={c} opacity="0.08" />}
        {showArea && <path d={area} fill={`url(#fill${uid})`} />}
        <path d={line} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 5px ${c}66)` }} />
        {showDots && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill={c} vectorEffect="non-scaling-stroke" />)}
        {showLast && <circle cx={last[0]} cy={last[1]} r="2.6" fill="var(--surface-page)" stroke={c} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />}
      </svg>
      {labels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}
