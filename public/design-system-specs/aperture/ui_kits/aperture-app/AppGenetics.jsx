const { Card, StatusPill, ListItem, Button } = window.ApertureDesignSystem_6066d1;
const AG = (n, s = 20) => <i data-lucide={n} style={{ width: s, height: s }}></i>;

function AppGenetics({ go }) {
  const d = window.APERTURE.genetics;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "4px 2px" }}>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>DNA insights</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>Genetics</div>
      </div>

      <Card gradient="var(--grad-vitality)" radius="2xl" padding="lg" style={{ color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", width: 22, height: 22 }}>{AG("dna", 22)}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Whole-genome analysis</span>
        </div>
        <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>{d.summary}</div>
        <div style={{ display: "flex", gap: 24, marginTop: 18 }}>
          <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28 }}>{d.traits}</div><div style={{ fontSize: 12, opacity: 0.85 }}>Traits</div></div>
          <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28 }}>{d.markers.toLocaleString()}</div><div style={{ fontSize: 12, opacity: 0.85 }}>Risk markers</div></div>
        </div>
      </Card>

      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>Genetic risk highlights</div>
        <Card radius="xl" padding="sm">
          {d.highlights.map((h, i) => (
            <ListItem key={h.trait} icon={AG(h.icon)} iconTone={h.tone === "attention" ? "vitals" : h.tone === "fair" ? "nutrition" : "activity"}
              title={h.trait} subtitle={h.detail}
              trailing={<StatusPill tone={h.tone} size="sm">{h.risk}</StatusPill>}
              divider={i < d.highlights.length - 1} chevron onClick={() => {}} />
          ))}
        </Card>
      </div>

      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>Ancestry composition</div>
        <Card radius="xl" padding="md">
          <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", marginBottom: 16 }}>
            {d.ancestry.map(a => <div key={a.region} style={{ width: `${a.pct}%`, background: a.color }} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.ancestry.map(a => (
              <div key={a.region} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: a.color }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{a.region}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14 }}>{a.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Button variant="secondary" size="lg" fullWidth iconRight={AG("chevron-right")}>Explore all 340 traits</Button>
    </div>
  );
}
window.AppGenetics = AppGenetics;
