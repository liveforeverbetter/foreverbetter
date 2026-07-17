const { Card, ScoreCard, MetricTile, StatusPill, ListItem, Switch, AreaChart, RangeGauge, InsightBanner } = window.ApertureDesignSystem_6066d1;
const AW = (n, s = 20) => <i data-lucide={n} style={{ width: s, height: s }}></i>;

function VitalsColumns({ signals }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 150 }}>
      {signals.map((s, i) => {
        const bad = s.status === "high";
        const h = bad ? 150 : 108 - (i % 2) * 14;
        const col = bad ? "var(--vitals-50)" : "var(--sleep-50)";
        const chip = bad ? "var(--vitals-500)" : "var(--sleep-500)";
        return (
          <div key={s.id} style={{ flex: 1, height: h, borderRadius: 999, background: col, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 999, background: chip, color: "#fff" }}>{AW(s.icon, 17)}</span>
            {bad && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 999, background: "var(--vitals-500)", color: "#fff" }}>{AW("activity", 15)}</span>}
          </div>
        );
      })}
    </div>
  );
}

function AppWearables({ go }) {
  const w = window.APERTURE.wearables;
  const v = window.APERTURE.vitals;
  const h = window.APERTURE.heart;
  const c = window.APERTURE.cardio;
  const [devices, setDevices] = React.useState(w.devices);
  const toggle = (i) => setDevices(ds => ds.map((d, j) => j === i ? { ...d, connected: !d.connected } : d));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "4px 2px" }}>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Devices &amp; overnight signals</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>Wearables</div>
      </div>

      {/* live HR */}
      <Card radius="xl" padding="md">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", color: "var(--heart-500)" }}>{AW("heart-pulse", 18)}</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Live heart rate</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>{w.liveHr}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>bpm</span>
          </div>
        </div>
        <AreaChart data={w.hrSeries} color="var(--heart-500)" height={72} yTicks={2} />
      </Card>

      {/* Vitals — 2 out of range */}
      <Card radius="2xl" padding="lg">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--vitals-700)", marginBottom: 14 }}>{v.outOfRange} out of range</div>
        <VitalsColumns signals={v.signals} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginTop: 18 }}>{v.headline}</div>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{v.body}</p>
      </Card>

      {/* Heart health score */}
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>Heart Health Score</div>
        <ScoreCard score={h.score} band={h.band} tone="good" delta={h.delta} description={h.description}
          footer={
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              {h.metrics.slice(0, 2).map(m => (
                <div key={m.label} style={{ background: "var(--surface-card)", borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{m.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>{m.value}</span>
                  </div>
                  <StatusPill tone={m.statusTone} size="sm" style={{ marginTop: 6 }}>{m.status}</StatusPill>
                </div>
              ))}
            </div>
          } />
      </div>

      {/* Cardio load + fitness index */}
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>Daily cardio load</div>
        <Card radius="xl" padding="md">
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12 }}>2 workouts today</div>
          <AreaChart data={c.today} color="var(--activity-500)" targetBand={[20, 30]} height={120} xLabels={c.labels} />
          <div style={{ marginTop: 18 }}>
            <RangeGauge status={c.status} statusTone="good" value={c.position} band={c.band} leftLabel="Under" rightLabel="Injury risk" />
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{c.note}</p>
        </Card>
      </div>

      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>Connected devices</div>
        <Card radius="xl" padding="sm">
          {devices.map((dv, i) => (
            <ListItem key={dv.name} icon={AW(dv.icon)} iconTone={dv.tone} title={dv.name} subtitle={dv.detail}
              divider={i < devices.length - 1}
              trailing={<Switch checked={dv.connected} onChange={() => toggle(i)} size="sm" />} />
          ))}
        </Card>
      </div>
    </div>
  );
}
window.AppWearables = AppWearables;
