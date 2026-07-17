import React from 'react';

const channels = {
  recovery: 'var(--metric-recovery)', strain: 'var(--metric-strain)',
  sleep: 'var(--metric-sleep)', stress: 'var(--metric-stress)', brand: 'var(--brand)',
};

/** Meridian Sparkline — a tiny inline trend line for stat tiles and rows. */
export function Sparkline({ data = [], channel = 'brand', width = 72, height = 24, showArea = true, style }) {
  const vals = data.map(d => (typeof d === 'number' ? d : d.value));
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const c = channels[channel] || channels.brand;
  const uid = React.useId ? React.useId().replace(/:/g, '') : 'spk' + channel;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1 || 1)) * width,
    height - 2 - ((v - lo) / span) * (height - 4),
  ]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = line + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block', ...style }}>
      <defs>
        <linearGradient id={`spk${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && <path d={area} fill={`url(#spk${uid})`} />}
      <path d={line} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
