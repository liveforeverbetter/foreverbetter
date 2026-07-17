const { Card, ScoreCard, InsightBanner, MetricTile, ActivityRing, ProgressRing, StatusPill, ListItem, SegmentedControl, IconButton } = window.ApertureDesignSystem_6066d1;
const AI = (n, s = 20) => <i data-lucide={n} style={{ width: s, height: s }}></i>;

function AppOverview({ go }) {
  const d = window.APERTURE.overview;
  const u = window.APERTURE.user;
  const [tab, setTab] = React.useState("overview");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{d.date}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}>{d.greeting}</div>
        </div>
        <IconButton label="Search" variant="ghost">{AI("search")}</IconButton>
        <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--grad-vitality)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{u.initials}</div>
      </div>

      <SegmentedControl iconOnly value={tab} onChange={setTab} options={[
        { id: "overview", label: "Overview", icon: AI("layout-grid", 18) },
        { id: "activity", label: "Activity", icon: AI("footprints", 18) },
        { id: "sleep", label: "Sleep", icon: AI("moon", 18) },
        { id: "nutrition", label: "Nutrition", icon: AI("apple", 18) },
        { id: "mind", label: "Mind", icon: AI("brain", 18) },
        { id: "vitals", label: "Vitals", icon: AI("heart-pulse", 18) },
      ]} style={{ width: "100%", justifyContent: "space-between" }} />

      <InsightBanner gradient="var(--grad-mesh)" glow eyebrow="Aperture insight"
        title={d.insight.title} body={d.insight.body} dots={3} activeDot={0} />

      {/* energy score */}
      <Card radius="xl" padding="md">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 4 }}>Energy score</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 52, lineHeight: 1, letterSpacing: "-0.02em" }}>{d.energy}</span>
              <StatusPill tone="good" style={{ marginBottom: 8 }}>{d.energyBand}</StatusPill>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[38, 55, 82, 70, 60, 75, 82].map((v, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: 999, background: i === 6 ? "var(--score-good)" : i === 2 ? "var(--sleep-400)" : "var(--ink-200)" }}></span>
            ))}
          </div>
        </div>
      </Card>

      {/* activity + sleep */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card radius="xl" padding="md" interactive onClick={() => go("wearables")}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 10 }}>Daily activity</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0 6px" }}>
            <ActivityRing size={104} rings={d.rings.map(r => ({ value: r.value, max: r.max, color: r.color }))} />
          </div>
        </Card>
        <Card radius="xl" padding="md" interactive onClick={() => go("wearables")}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 10 }}>Sleep score</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0 6px" }}>
            <ProgressRing value={84} size={104} color="var(--sleep-500)">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30 }}>84</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>7h 12m</span>
            </ProgressRing>
          </div>
        </Card>
      </div>

      {/* pillars */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 2px 10px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Your pillars</span>
          <span style={{ fontSize: 13, color: "var(--text-brand)", fontWeight: 600 }}>See all</span>
        </div>
        <Card radius="xl" padding="sm">
          {d.pillars.map((p, i) => (
            <ListItem key={p.id} icon={AI(p.icon)} iconTone={p.tone} title={p.label}
              subtitle={p.status} value={p.value} divider={i < d.pillars.length - 1}
              onClick={() => go("actionplan")} chevron />
          ))}
        </Card>
      </div>
    </div>
  );
}
window.AppOverview = AppOverview;
