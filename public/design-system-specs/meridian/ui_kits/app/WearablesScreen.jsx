// WearablesScreen — the device-measured layer: sleep / recovery / strain rings + activity.
const WearablesScreen = () => {
  const M = window.MeridianDesignSystem_0f3f3a;
  const { MetricRing, StatusBanner, StatTile, ActivityRow, Tabs, TrendChart, Icon } = M;
  const [range, setRange] = React.useState('day');
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 20px' }}>
      <h1 style={{ margin: '2px 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Wearables</h1>
      <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>Continuous signals from your band: sleep, recovery, strain and heart health.</p>

      <Tabs value={range} onChange={setRange} variant="segmented" style={{ marginBottom: 18 }}
        items={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-around', margin: '4px 0 20px' }}>
        <MetricRing channel="sleep" value={88} unit="%" label="Sleep" size={98} thickness={9} />
        <MetricRing channel="stress" value={65} unit="%" label="Recovery" size={98} thickness={9} />
        <MetricRing channel="strain" value={5.1} max={21} display="5.1" label="Strain" size={98} thickness={9} />
      </div>

      <StatusBanner tone="warning" title="Lower HRV Today" icon={<Icon name="activity" size={20} />} style={{ marginBottom: 18 }}>
        Your HRV is 7% lower than usual, landing you a yellow Recovery. Yellow means your body is functioning normally, but your HRV trend is worth watching.
      </StatusBanner>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <StatTile icon={<Icon name="heart-pulse" size={16} />} iconTone="recovery" label="HRV" value={85} secondary="91 base" delta="4" deltaTone="up" />
        <StatTile icon={<Icon name="heart" size={16} />} iconTone="strain" label="RHR" value={52} unit="bpm" delta="1" deltaTone="down" />
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Recovery · 7 days</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>66%</span>
        </div>
        <TrendChart channel="stress" height={130} min={40} max={90} band={[60, 80]}
          data={[62, 58, 71, 65, 60, 74, 66]} labels={['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']} />
      </div>

      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>Today's activities</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ActivityRow icon="moon" channel="sleep" duration="6:37" label="Sleep" start="11:32 PM" end="6:54 AM" />
        <ActivityRow icon="run" channel="strain" duration="0:48" label="Zone 2 Run" start="7:40 AM" end="8:28 AM" meta="Strain 8.2" />
      </div>
    </div>
  );
};
window.WearablesScreen = WearablesScreen;
