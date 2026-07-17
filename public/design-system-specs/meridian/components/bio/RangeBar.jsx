import React from 'react';

/**
 * Meridian RangeBar — the signature biomarker reference-range visual. A horizontal
 * track split into colored zones (low / optimal / high) with a marker showing where
 * the measured value falls. Zones are given as boundary stops across [min,max].
 */
export function RangeBar({
  value, min = 0, max = 100,
  optimalLow, optimalHigh,
  zones, height = 8, showScale = false, valueLabel, style,
}) {
  // Default 3-zone model from optimal window, else caller-supplied zones.
  const segs = zones || [
    { to: optimalLow != null ? optimalLow : min + (max - min) * 0.33, tone: 'low' },
    { to: optimalHigh != null ? optimalHigh : min + (max - min) * 0.66, tone: 'optimal' },
    { to: max, tone: 'high' },
  ];
  const toneColor = {
    low: 'var(--strain-400)', optimal: 'var(--green-400)', high: 'var(--amber-400)',
    critical: 'var(--red-400)', track: 'var(--metric-track)',
  };
  const pct = (n) => Math.max(0, Math.min(100, ((n - min) / (max - min)) * 100));
  let cursor = min;
  const markerPct = value != null ? pct(value) : null;
  const [shownMarker, setShownMarker] = React.useState(0);
  React.useEffect(() => {
    if (markerPct == null) return;
    const id = requestAnimationFrame(() => setShownMarker(markerPct));
    return () => cancelAnimationFrame(id);
  }, [markerPct]);
  const inOptimal = value != null && optimalLow != null && optimalHigh != null
    ? value >= optimalLow && value <= optimalHigh : null;

  return (
    <div style={{ width: '100%', ...style }}>
      {valueLabel != null && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: inOptimal === false ? 'var(--amber-400)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{valueLabel}</span>
        </div>
      )}
      <div style={{ position: 'relative', height, borderRadius: 'var(--radius-pill)', overflow: 'hidden', display: 'flex' }}>
        {segs.map((s, i) => {
          const from = cursor; cursor = s.to;
          const w = pct(s.to) - pct(from);
          return <span key={i} style={{ width: `${w}%`, background: toneColor[s.tone] || toneColor.track, opacity: 0.55 }} />;
        })}
      </div>
      {markerPct != null && (
        <div style={{ position: 'relative', height: 0 }}>
          <span style={{ position: 'absolute', top: -(height + 12), left: `${shownMarker}%`, transform: 'translateX(-50%)', width: 3, height: height + 8, borderRadius: 2, background: 'var(--text-primary)', boxShadow: '0 0 0 2px var(--surface-card)', transition: 'left var(--dur-slow) var(--ease-out)' }} />
        </div>
      )}
      {showScale && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
          <span>{min}</span>
          {optimalLow != null && optimalHigh != null && <span style={{ color: 'var(--green-400)' }}>{optimalLow}–{optimalHigh} optimal</span>}
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
