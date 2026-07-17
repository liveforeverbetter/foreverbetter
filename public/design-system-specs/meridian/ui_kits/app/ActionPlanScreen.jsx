// ActionPlanScreen — concrete steps inferred from all modalities.
const ActionPlanScreen = () => {
  const M = window.MeridianDesignSystem_0f3f3a;
  const { ProgressBar, PlanItem, Badge, Icon, InsightCard, Separator, JournalWeek } = M;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Action Plan</h1>
        <Badge tone="brand" variant="solid" icon={<Icon name="pencil" size={12} />} style={{ background: 'var(--grad-premium)', color: '#fff' }}>Customize</Badge>
      </div>
      <p style={{ margin: '4px 0 18px', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>Concrete steps for this week, chosen from your genetics, biomarkers and wearable trends.</p>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>This week</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>3 days left</div>
          </div>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>57%</span>
          </span>
        </div>
        <ProgressBar value={57} tone="brand" height={8} style={{ marginBottom: 6 }} />
        <PlanItem label="4,500+ Steps" current={2} target={7} />
        <PlanItem label="7:00+ Hours of Sleep" current={0} target={7} channel="sleep" />
        <Separator inset={4} />
        <PlanItem label="Zone 2 Cardio, 1:10+ per week" current={2} target={2} channel="recovery" />
        <PlanItem label="Strength Training, 2× per week" current={2} target={2} channel="recovery" />
      </div>

      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>Why these actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
        <InsightCard icon={<Icon name="dna" size={18} />} iconTone="strain" title="Carb timing">
          Your TCF7L2 variant and a fasting glucose of 97 mg/dL make Zone 2 work before meals your highest-leverage habit.
        </InsightCard>
        <InsightCard icon={<Icon name="moon" size={18} />} iconTone="sleep" title="Sleep debt">
          You have hit 7 hours only 3 of the last 7 nights, and low sleep is tracking with your lower HRV.
        </InsightCard>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Journal · this week</span>
        <JournalWeek style={{ marginTop: 16 }} days={[
          { label: 'SAT', state: 'complete' }, { label: 'SUN', state: 'complete' }, { label: 'MON', state: 'missed' },
          { label: 'TUE', state: 'complete' }, { label: 'WED', state: 'partial' }, { label: 'THU', state: 'complete' }, { label: 'FRI', state: 'today' },
        ]} />
      </div>
    </div>
  );
};
window.ActionPlanScreen = ActionPlanScreen;
