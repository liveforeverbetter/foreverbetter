// GeneticsScreen — genetic trait cards + polygenic risk.
const GeneticsScreen = () => {
  const M = window.MeridianDesignSystem_0f3f3a;
  const { GeneCard, RiskMeter, Icon } = M;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 20px' }}>
      <h1 style={{ margin: '2px 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Genetics</h1>
      <p style={{ margin: '0 0 18px', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>Traits and predispositions from your DNA, the fixed baseline your other data moves around.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
          <RiskMeter level="reduced" label="Cardiovascular risk" caption="Reduced" />
        </div>
        <GeneCard tag="Metabolism" trait="Caffeine Clearance" gene="CYP1A2" genotype="AA" effect="protective"
          summary="You clear caffeine quickly. Afternoon coffee is unlikely to disrupt your sleep." level="reduced" riskCaption="Fast metabolizer" onClick={() => {}} />
        <GeneCard tag="Cardio-metabolic" trait="Type 2 Diabetes" gene="TCF7L2" genotype="CT" effect="risk"
          summary="Your polygenic score sits slightly above typical. Protein-forward meals and Zone 2 work help most." level="increased" riskCaption="Slightly increased" onClick={() => {}} />
        <GeneCard tag="Fitness" trait="Power vs. Endurance" gene="ACTN3" genotype="RR" effect="neutral"
          summary="You carry two power alleles, so your body responds well to strength and sprint work." onClick={() => {}} />
      </div>
    </div>
  );
};
window.GeneticsScreen = GeneticsScreen;
