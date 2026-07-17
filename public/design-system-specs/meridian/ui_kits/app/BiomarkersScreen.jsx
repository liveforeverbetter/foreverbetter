// BiomarkersScreen — blood panels with reference ranges.
const BiomarkersScreen = () => {
  const M = window.MeridianDesignSystem_0f3f3a;
  const { BiomarkerPanel, BiomarkerRow, Button, Icon } = M;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 20px' }}>
      <h1 style={{ margin: '2px 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Biomarkers</h1>
      <p style={{ margin: '0 0 18px', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>Your last blood draw, read against optimal ranges rather than lab-normal.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BiomarkerPanel name="Metabolic & Lipids" collected="Jul 2, 2026" inRange={3} total={4}
          action={<Button size="sm" variant="secondary" block iconLeft={<Icon name="file-text" size={15} />}>Full report</Button>}>
          <BiomarkerRow name="ApoB" value={78} unit="mg/dL" status="optimal" min={40} max={130} optimalLow={40} optimalHigh={90} delta="6" deltaTone="down" />
          <BiomarkerRow name="Fasting Glucose" value={97} unit="mg/dL" status="high" min={70} max={110} optimalLow={74} optimalHigh={95} delta="3" deltaTone="up" />
          <BiomarkerRow name="HDL" value={62} unit="mg/dL" status="optimal" min={30} max={90} optimalLow={50} optimalHigh={90} />
          <BiomarkerRow name="hs-CRP" value={0.4} unit="mg/L" status="optimal" min={0} max={3} optimalLow={0} optimalHigh={1} showRange={false} style={{ borderBottom: 'none' }} />
        </BiomarkerPanel>
        <BiomarkerPanel name="Hormones & Vitamins" collected="Jul 2, 2026" inRange={2} total={2}>
          <BiomarkerRow name="Vitamin D" value={44} unit="ng/mL" status="optimal" min={20} max={80} optimalLow={40} optimalHigh={60} />
          <BiomarkerRow name="TSH" value={1.8} unit="mIU/L" status="optimal" min={0.4} max={4.5} optimalLow={1} optimalHigh={2.5} showRange={false} style={{ borderBottom: 'none' }} />
        </BiomarkerPanel>
      </div>
    </div>
  );
};
window.BiomarkersScreen = BiomarkersScreen;
