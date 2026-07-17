const { Card, InsightBanner, StatusPill, ListItem, Button, ProgressRing } = window.ApertureDesignSystem_6066d1;
const AP = (n, s = 20) => <i data-lucide={n} style={{ width: s, height: s }}></i>;

function AppActionPlan({ go }) {
  const d = window.APERTURE.actionPlan;
  const [tasks, setTasks] = React.useState(d.tasks);
  const done = tasks.filter(t => t.done).length;
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Personalized for you</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>Action plan</div>
        </div>
      </div>

      <Card gradient="var(--grad-dawn)" radius="2xl" padding="lg">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ProgressRing value={done} max={tasks.length} size={78} thickness={9} color="var(--teal-500)">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{done}<span style={{ fontSize: 14, color: "var(--text-muted)" }}>/{tasks.length}</span></span>
          </ProgressRing>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--teal-700)", marginBottom: 4 }}>Today</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, lineHeight: 1.25 }}>{d.focus}</div>
          </div>
        </div>
      </Card>

      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>Today's actions</div>
        <Card radius="xl" padding="sm">
          <style>{`@keyframes apCheckIn{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){@keyframes apCheckIn{from{opacity:0}to{opacity:1}}}`}</style>
          {tasks.map((t, i) => (
            <div key={t.id} onClick={() => toggle(t.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", cursor: "pointer", borderBottom: i < tasks.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, flex: "0 0 26px", borderRadius: 999, border: t.done ? "none" : "2px solid var(--border-strong)", background: t.done ? `var(--${t.tone}-500)` : "transparent", color: "#fff", transition: "background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)" }}>
                {t.done && <span key="c" style={{ display: "inline-flex", animation: "apCheckIn var(--dur-base) var(--ease-out)" }}>{AP("check", 15)}</span>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: t.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{t.meta}</div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 999, background: `var(--${t.tone}-50)`, color: `var(--${t.tone}-500)` }}>{AP(t.icon, 17)}</span>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "2px 2px 10px" }}>Why these actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {d.recommendations.map((r, i) => (
            <Card key={i} tone={r.tone === "heart" ? "heart" : r.tone} radius="xl" padding="md">
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, flex: "0 0 40px", borderRadius: 12, background: `var(--${r.tone}-500)`, color: "#fff" }}>{AP(r.icon)}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>{r.body}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth icon={AP("sparkles")}>Regenerate my plan</Button>
    </div>
  );
}
window.AppActionPlan = AppActionPlan;
