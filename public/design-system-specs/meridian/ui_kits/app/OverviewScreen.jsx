// OverviewScreen — multimodal inference across genetics, biomarkers and wearables.
const OverviewScreen = ({ onOpen }) => {
  const M = window.MeridianDesignSystem_0f3f3a;
  const { TopNav, HealthspanOrb, StatusBanner, InsightCard, StatTile, Icon } = M;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 20px' }}>
      <TopNav user={{ name: 'Blake Sun', tone: 'warm' }} date="TODAY" battery={68} style={{ padding: '4px 0 6px', background: 'transparent', height: 52 }} />

      <h1 style={{ margin: '10px 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Welcome, Blake</h1>
      <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>What your genetics, biomarkers and wearables say together, read as one picture.</p>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 18px' }}>
        <HealthspanOrb value="40.7" label="BIO AGE" caption="9.2 years younger" tone="good" size={240} />
      </div>

      <StatusBanner tone="info" title="Today's synthesis" icon={<Icon name="sparkles" size={20} />} style={{ marginBottom: 18 }}>
        Your TCF7L2 variant plus a fasting glucose of 97 mg/dL means carbs hit you harder than average. Last night's strong recovery is a good day to spend that with Zone 2 training before your next meal.
      </StatusBanner>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <StatTile icon={<Icon name="watch" size={16} />} iconTone="recovery" label="Wearables" value="65%" secondary="Recovery" onClick={() => onOpen('wearables')} />
        <StatTile icon={<Icon name="droplet" size={16} />} iconTone="stress" label="Biomarkers" value="9/11" secondary="in range" onClick={() => onOpen('biomarkers')} />
        <StatTile icon={<Icon name="dna" size={16} />} iconTone="strain" label="Genetics" value="Low" secondary="cardio risk" onClick={() => onOpen('genetics')} />
        <StatTile icon={<Icon name="moon" size={16} />} iconTone="sleep" label="Sleep" value="88%" secondary="7:00 need met" onClick={() => onOpen('wearables')} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <InsightCard icon={<Icon name="target" size={18} />} iconTone="brand" title="3 actions in your plan today" onClick={() => onOpen('plan')} />
        <InsightCard icon={<Icon name="trending-up" size={18} />} iconTone="recovery" title="Bio Age is 0.1 years younger this week" onClick={() => onOpen('healthspan')} />
      </div>
    </div>
  );
};
window.OverviewScreen = OverviewScreen;
