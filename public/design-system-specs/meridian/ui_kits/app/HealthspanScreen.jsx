// HealthspanScreen — longevity / bio-age hero.
const HealthspanScreen = ({ onBack }) => {
  const M = window.MeridianDesignSystem_0f3f3a;
  const { HealthspanOrb, Slider, StatusBanner, Icon, IconButton } = M;
  const [pace, setPace] = React.useState(0.2);
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <IconButton aria-label="Back" variant="ghost" onClick={onBack}><Icon name="chevron-left" size={22} /></IconButton>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>HEALTHSPAN</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>NEXT UPDATE IN 7 DAYS</div>
        </div>
        <IconButton aria-label="Info" variant="outline" round><Icon name="info" size={18} /></IconButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '10px 0 8px' }}>
        <Icon name="chevron-left" size={16} color="var(--text-tertiary)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', color: 'var(--text-primary)' }}>JUL 12 – JUL 18</span>
        <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 26px' }}>
        <HealthspanOrb value="40.7" label="BIO AGE" caption="9.2 years younger" tone="good" size={272} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 14 }}>Pace of Aging</div>
        <Slider value={pace} min={-1} max={3} step={0.1} ticks={41} valueLabel={pace.toFixed(1) + 'x'} leftLabel="-1.0x" rightLabel="3.0x" onChange={setPace} />
      </div>

      <StatusBanner tone="success" title="Good Progress" icon={<Icon name="trending-up" size={20} />}>
        Your Bio Age is younger this week by 0.1 and your Pace of Aging is still slow, though it has increased slightly. Keep an eye on this trend, but celebrate the progress you've been making toward your long-term health.
      </StatusBanner>
    </div>
  );
};
window.HealthspanScreen = HealthspanScreen;
