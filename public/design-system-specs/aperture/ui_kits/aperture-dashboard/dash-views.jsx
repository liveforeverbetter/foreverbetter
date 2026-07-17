const D = window.ApertureDesignSystem_6066d1;
const { Card, ScoreCard, MetricTile, InsightBanner, ActivityRing, ProgressRing, RangeGauge, AreaChart, StatusPill, ListItem, Button, Switch } = D;
const DI = (n, s = 20) => <i data-lucide={n} style={{ width: s, height: s }}></i>;
const A = window.APERTURE;

function Header({ eyebrow, title, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 4 }}>{eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", gap: 10 }}>{actions}</div>
    </div>
  );
}
function Section({ title, children, right }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ---------------- OVERVIEW ---------------- */
function DashOverview({ go }) {
  const d = A.overview;
  return (
    <div>
      <Header eyebrow={d.date} title={d.greeting}
        actions={<><Button variant="secondary" icon={DI("calendar",18)}>Today</Button><Button variant="primary" icon={DI("plus",18)}>Log a reading</Button></>} />
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, marginBottom: 18 }}>
        <InsightBanner gradient="var(--grad-mesh)" glow eyebrow="Aperture insight" title={d.insight.title} body={d.insight.body} dots={3} activeDot={0} />
        <Card radius="xl" padding="lg" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Energy score</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 56, lineHeight: 1 }}>{d.energy}</span>
            <StatusPill tone="good" style={{ marginBottom: 12 }}>{d.energyBand}</StatusPill>
          </div>
          <AreaChart data={[62,58,70,66,74,78,82]} color="var(--score-good)" height={60} yTicks={2} style={{ marginTop: 8 }} />
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {d.pillars.map(p => (
          <Card key={p.id} radius="lg" padding="md" interactive onClick={() => go("actionplan")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 999, background: `var(--${p.tone}-50)`, color: `var(--${p.tone}-500)` }}>{DI(p.icon, 18)}</span>
              <StatusPill tone={p.statusTone} size="sm">{p.status}</StatusPill>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{p.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, marginTop: 2 }}>{p.value}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: 18 }}>
        <Card radius="xl" padding="lg" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12, textAlign: "left" }}>Daily activity</div>
          <ActivityRing size={140} rings={d.rings.map(r => ({ value: r.value, max: r.max, color: r.color }))} />
        </Card>
        <Card radius="xl" padding="lg" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12, textAlign: "left" }}>Sleep score</div>
          <ProgressRing value={84} size={140} thickness={13} color="var(--sleep-500)">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 38 }}>84</span>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>7h 12m</span>
          </ProgressRing>
        </Card>
        <Card radius="xl" padding="lg">
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 4 }}>Today's cardio load</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--score-good)", marginBottom: 10 }}>Balanced</div>
          <AreaChart data={A.cardio.today} color="var(--activity-500)" targetBand={[20,30]} height={110} xLabels={A.cardio.labels} />
        </Card>
      </div>
    </div>
  );
}

/* ---------------- ACTION PLAN ---------------- */
function DashActionPlan({ go }) {
  const d = A.actionPlan;
  const [tasks, setTasks] = React.useState(d.tasks);
  const done = tasks.filter(t => t.done).length;
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  return (
    <div>
      <Header eyebrow="Personalized for you" title="Action plan"
        actions={<Button variant="primary" icon={DI("sparkles",18)}>Regenerate plan</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <div>
          <Card gradient="var(--grad-dawn)" radius="2xl" padding="lg" style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <ProgressRing value={done} max={tasks.length} size={86} thickness={10} color="var(--teal-500)">
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>{done}<span style={{ fontSize: 15, color: "var(--text-muted)" }}>/{tasks.length}</span></span>
              </ProgressRing>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--teal-700)", marginBottom: 4 }}>This week's focus</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, lineHeight: 1.25 }}>{d.focus}</div>
              </div>
            </div>
          </Card>
          <Section title="Today's actions">
            <Card radius="xl" padding="sm">
              <style>{`@keyframes apCheckIn{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){@keyframes apCheckIn{from{opacity:0}to{opacity:1}}}`}</style>
              {tasks.map((t, i) => (
                <div key={t.id} onClick={() => toggle(t.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 10px", cursor: "pointer", borderBottom: i < tasks.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, flex: "0 0 26px", borderRadius: 999, border: t.done ? "none" : "2px solid var(--border-strong)", background: t.done ? `var(--${t.tone}-500)` : "transparent", color: "#fff", transition: "background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)" }}>{t.done && <span key="c" style={{ display: "inline-flex", animation: "apCheckIn var(--dur-base) var(--ease-out)" }}>{DI("check", 15)}</span>}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 999, background: `var(--${t.tone}-50)`, color: `var(--${t.tone}-500)` }}>{DI(t.icon, 17)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: t.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{t.meta}</div>
                  </div>
                </div>
              ))}
            </Card>
          </Section>
        </div>
        <Section title="Why these actions">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {d.recommendations.map((r, i) => (
              <Card key={i} tone={r.tone} radius="xl" padding="md">
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 12, background: `var(--${r.tone}-500)`, color: "#fff", marginBottom: 12 }}>{DI(r.icon)}</span>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.title}</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>{r.body}</div>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ---------------- GENETICS ---------------- */
function DashGenetics({ go }) {
  const d = A.genetics;
  return (
    <div>
      <Header eyebrow="DNA insights" title="Genetics"
        actions={<Button variant="secondary" icon={DI("download",18)}>Export raw data</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
        <Card gradient="var(--grad-vitality)" radius="2xl" padding="lg" style={{ color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>{DI("dna", 22)}<span style={{ fontWeight: 700, fontSize: 16 }}>Whole-genome analysis</span></div>
          <div style={{ fontSize: 15, opacity: 0.92, lineHeight: 1.5 }}>{d.summary}</div>
          <div style={{ display: "flex", gap: 36, marginTop: 22 }}>
            <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34 }}>{d.traits}</div><div style={{ fontSize: 13, opacity: 0.85 }}>Traits analyzed</div></div>
            <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34 }}>{d.markers.toLocaleString()}</div><div style={{ fontSize: 13, opacity: 0.85 }}>Risk markers</div></div>
          </div>
        </Card>
        <Card radius="2xl" padding="lg">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Ancestry composition</div>
          <div style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", marginBottom: 18 }}>
            {d.ancestry.map(a => <div key={a.region} style={{ width: `${a.pct}%`, background: a.color }} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
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
      <Section title="Genetic risk highlights" right={<span style={{ fontSize: 13, color: "var(--text-brand)", fontWeight: 600, cursor: "pointer" }}>Explore all 340 traits</span>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {d.highlights.map(h => (
            <Card key={h.trait} radius="xl" padding="md" interactive>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 999, background: `var(--${h.tone === "attention" ? "vitals" : h.tone === "fair" ? "nutrition" : "activity"}-50)`, color: `var(--${h.tone === "attention" ? "vitals" : h.tone === "fair" ? "nutrition" : "activity"}-500)` }}>{DI(h.icon)}</span>
                <StatusPill tone={h.tone} size="sm">{h.risk}</StatusPill>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{h.trait}</div>
              <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>{h.detail}</div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------------- BIOMARKERS ---------------- */
function DashBiomarkers({ go }) {
  const d = A.biomarkers;
  return (
    <div>
      <Header eyebrow={d.lastDraw} title="Biomarkers"
        actions={<><Button variant="secondary" icon={DI("file-text",18)}>Lab report</Button><Button variant="primary" icon={DI("plus",18)}>Add results</Button></>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 18, marginBottom: 22 }}>
        <Card radius="2xl" padding="lg" glow>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Antioxidant Index</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, margin: "6px 0 4px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 54, lineHeight: 1 }}>{d.antioxidant.value}</span>
            <StatusPill tone="good" variant="soft" icon={DI("trending-up",13)} style={{ marginBottom: 12 }}>+{d.antioxidant.delta}</StatusPill>
          </div>
          <StatusPill tone="good">{d.antioxidant.band}</StatusPill>
          <AreaChart data={d.antioxidant.trend} color="var(--activity-500)" height={80} yTicks={2} style={{ marginTop: 14 }} xLabels={["6 wk ago","now"]} />
        </Card>
        <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 14 }}>
          {d.panels.map(panel => (
            <div key={panel.group}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>{panel.group}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {panel.items.map(it => (
                  <MetricTile key={it.label} label={it.label} value={it.value} unit={it.unit} status={it.status} statusTone={it.statusTone} hint={`Range ${it.range}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- WEARABLES ---------------- */
function DashWearables({ go }) {
  const w = A.wearables, v = A.vitals, h = A.heart, c = A.cardio;
  const [devices, setDevices] = React.useState(w.devices);
  const toggle = (i) => setDevices(ds => ds.map((d, j) => j === i ? { ...d, connected: !d.connected } : d));
  return (
    <div>
      <Header eyebrow="Devices & overnight signals" title="Wearables"
        actions={<Button variant="primary" icon={DI("plus",18)}>Connect device</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card radius="xl" padding="lg">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "var(--heart-500)", display: "inline-flex" }}>{DI("heart-pulse",18)}</span><span style={{ fontWeight: 700 }}>Live heart rate</span></div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>{w.liveHr}</span><span style={{ fontSize: 13, color: "var(--text-muted)" }}>bpm</span></div>
          </div>
          <AreaChart data={w.hrSeries} color="var(--heart-500)" height={90} yTicks={2} />
        </Card>
        <Card radius="2xl" padding="lg">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--vitals-700)", marginBottom: 14 }}>{v.outOfRange} out of range overnight</div>
          <VitalsRow signals={v.signals} />
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <ScoreCard score={h.score} band={h.band} tone="good" delta={h.delta} description={h.description} radius="2xl" />
        <Card radius="2xl" padding="lg">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Daily cardio load</div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12 }}>2 workouts today</div>
          <AreaChart data={c.today} color="var(--activity-500)" targetBand={[20,30]} height={100} xLabels={c.labels} />
          <div style={{ marginTop: 18 }}><RangeGauge status={c.status} statusTone="good" value={c.position} band={c.band} leftLabel="Under" rightLabel="Injury risk" /></div>
        </Card>
      </div>
      <Section title="Connected devices">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {devices.map((dv, i) => (
            <Card key={dv.name} radius="lg" padding="md">
              <ListItem icon={DI(dv.icon)} iconTone={dv.tone} title={dv.name} subtitle={dv.detail}
                trailing={<Switch checked={dv.connected} onChange={() => toggle(i)} />} />
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
function VitalsRow({ signals }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 130 }}>
      {signals.map((s, i) => {
        const bad = s.status === "high";
        const hgt = bad ? 130 : 96 - (i % 2) * 12;
        return (
          <div key={s.id} style={{ flex: 1, height: hgt, borderRadius: 999, background: bad ? "var(--vitals-50)" : "var(--sleep-50)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "9px 0" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 999, background: bad ? "var(--vitals-500)" : "var(--sleep-500)", color: "#fff" }}>{DI(s.icon, 16)}</span>
            {bad && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, background: "var(--vitals-500)", color: "#fff" }}>{DI("activity", 13)}</span>}
          </div>
        );
      })}
    </div>
  );
}

window.DASH = { overview: DashOverview, actionplan: DashActionPlan, genetics: DashGenetics, biomarkers: DashBiomarkers, wearables: DashWearables };
