import React from 'react';
import { GenotypeChip } from './GenotypeChip.jsx';
import { RiskMeter } from './RiskMeter.jsx';

/**
 * Meridian GeneCard — a genetic trait / variant result. Shows the trait name, the
 * gene + genotype, a plain-language phenotype summary, and an optional risk meter.
 * The core surface for the genetic side of the data model.
 */
export function GeneCard({
  trait, gene, genotype, effect = 'neutral', summary, level, riskCaption,
  tag, onClick, style,
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', padding: 18, cursor: onClick ? 'pointer' : 'default',
      animation: 'mrd-fade-up var(--dur-slow) var(--ease-out) backwards',
      transition: 'border-color var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)',
      ...(hover && onClick ? { borderColor: 'var(--border-default)', transform: 'translateY(-2px)' } : {}),
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          {tag && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>{tag}</div>}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{trait}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {gene && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: 'var(--text-secondary)' }}>{gene}</span>}
          {genotype && <GenotypeChip genotype={genotype} effect={effect} size="sm" />}
        </div>
      </div>
      {summary && <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{summary}</p>}
      {level && <div style={{ marginTop: 16 }}><RiskMeter level={level} caption={riskCaption} /></div>}
    </div>
  );
}
