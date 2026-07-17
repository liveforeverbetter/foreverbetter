const { Card, ScoreCard, MetricTile, StatusPill, AreaChart, Button } = window.ApertureDesignSystem_6066d1;
const AB = (n, s = 20) => <i data-lucide={n} style={{ width: s, height: s }}></i>;

function AppBiomarkers({ go }) {
  const d = window.APERTURE.biomarkers;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "4px 2px" }}>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{d.lastDraw}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>Biomarkers</div>
      </div>

      <Card radius="2xl" padding="lg" glow>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 6 }}>Antioxidant Index</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48, lineHeight: 1 }}>{d.antioxidant.value}</span>
              <div style={{ marginBottom: 8 }}>
                <StatusPill tone="good">{d.antioxidant.band}</StatusPill>
              </div>
            </div>
          </div>
          <StatusPill tone="good" variant="soft" icon={AB("trending-up", 13)}>+{d.antioxidant.delta}</StatusPill>
        </div>
        <div style={{ marginTop: 12 }}>
          <AreaChart data={d.antioxidant.trend} color="var(--activity-500)" height={90} yTicks={2}
            xLabels={["6 wk ago", "now"]} />
        </div>
      </Card>

      {d.panels.map(panel => (
        <div key={panel.group}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>{panel.group}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {panel.items.map(it => (
              <MetricTile key={it.label} label={it.label} value={it.value} unit={it.unit}
                status={it.status} statusTone={it.statusTone} hint={`Range ${it.range}`} />
            ))}
          </div>
        </div>
      ))}

      <Button variant="secondary" size="lg" fullWidth icon={AB("file-text")}>View full lab report</Button>
    </div>
  );
}
window.AppBiomarkers = AppBiomarkers;
