/**
 * Performance dashboard (WHOOP-style voice) — thorough, all modalities.
 *
 * An original, production-grade athletic/recovery dashboard rendered from the
 * full transformed pipeline data: recovery/strain/HRV gauges, wearable domains,
 * a biomarker panel with a biological-age read, genetic "edges" (strengths),
 * polygenic risk bars, aging-hallmark load, pharmacogenomic/hereditary context,
 * and the full action plan (focus / maintain / retest). Bold, high-contrast,
 * uppercase-labelled, with animated arcs and bars. Design language is our own,
 * inspired by the performance-tracking genre, no proprietary assets.
 *
 * Consumes the transformed dashboard object (buildDashboardJSON output). Every
 * section degrades gracefully when a modality is not connected.
 */
import { resolveTheme, themeCss, type DesignTokens } from './theme.js';

type Any = any;
// Safe display of a value that may be a string, number, or an object like
// {value, unit, display}. Never renders "[object Object]".
const disp = (v: Any): string => {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.display != null) return String(v.display);
    if (v.value != null) return `${v.value}${v.unit ? ' ' + v.unit : ''}`;
    return String(v.text ?? v.label ?? v.name ?? '');
  }
  return String(v);
};
const esc = (s: unknown) => disp(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const num = (n?: number) => (n == null || Number.isNaN(n) ? '--' : String(Math.round(n)));
const clampPct = (n?: number) => Math.max(2, Math.min(100, Number(n ?? 0)));
const STATUS_VAR: Record<string, string> = {
  optimal: 'positive', good: 'positive', ok: 'positive', in_range: 'positive', strong: 'positive',
  watch: 'warning', upcoming: 'warning', borderline: 'warning', moderate: 'warning',
  needs_attention: 'negative', high: 'negative', low: 'negative', out_of_range: 'negative', poor: 'negative',
  missing: 'text-muted', not_connected: 'text-muted', not_provided: 'text-muted',
};
const sc = (s?: string) => `var(--${STATUS_VAR[String(s ?? '').toLowerCase()] ?? 'primary'})`;

// Semicircular gauge with tick marks + gradient arc + big value.
function gauge(label: string, score: number | undefined, id: string, stops: string[], sub?: string): string {
  const w = 210, h = 128, cx = w / 2, cy = 116, r = 88, sw = 15;
  const has = score != null;
  const a1 = Math.PI - (Math.PI * clampPct(score)) / 100;
  const P = (a: number, rad: number) => `${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy - rad * Math.sin(a)).toFixed(1)}`;
  const arc = (f: number, t: number, rad: number) => `M ${P(f, rad)} A ${rad} ${rad} 0 0 1 ${P(t, rad)}`;
  const ticks = Array.from({ length: 11 }, (_, i) => { const a = Math.PI - (Math.PI * i) / 10; return `<line x1="${(cx + (r + 11) * Math.cos(a)).toFixed(1)}" y1="${(cy - (r + 11) * Math.sin(a)).toFixed(1)}" x2="${(cx + (r + 3) * Math.cos(a)).toFixed(1)}" y2="${(cy - (r + 3) * Math.sin(a)).toFixed(1)}" stroke="var(--border)" stroke-width="2"/>`; }).join('');
  const grad = stops.map((s, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${s}"/>`).join('');
  return `<div class="gauge"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${grad}</linearGradient></defs>${ticks}
    <path d="${arc(Math.PI, 0, r)}" fill="none" stroke="var(--surface-alt)" stroke-width="${sw}" stroke-linecap="round"/>
    ${has ? `<path d="${arc(Math.PI, a1, r)}" fill="none" stroke="url(#${id})" stroke-width="${sw}" stroke-linecap="round" class="arc"/>` : ''}
  </svg><div class="gv">${num(score)}</div><div class="gl">${esc(label)}</div>${sub ? `<div class="gs">${esc(sub)}</div>` : ''}</div>`;
}

// Labeled horizontal meter with an animated fill.
function meter(name: string, value: string, pct: number, status?: string): string {
  return `<div class="mtr"><div class="mh"><span class="mn">${esc(name)}</span><span class="mv">${esc(value)}</span></div>
    <div class="mt"><i style="width:${clampPct(pct)}%;background:${sc(status)}"></i></div></div>`;
}

function section(kicker: string, title: string, body: string): string {
  return `<section class="sec"><div class="sec-h"><span class="sec-k">${esc(kicker)}</span><h2>${esc(title)}</h2></div>${body}</section>`;
}

function coverageChips(plan: Any, healthspan: Any): string {
  const conn = (healthspan?.connected ?? []) as Any[];
  const items = conn.length ? conn.map(c => `<span class="chip ${c.connected ? 'on' : 'off'}">${c.connected ? '●' : '○'} ${esc(c.name)}<i>${esc(c.count)}</i></span>`).join('') : '';
  return items ? `<div class="chips">${items}</div>` : '';
}

// ---- section renderers ----

function wearableSection(wa: Any): string {
  if (!wa || wa.status === 'missing' || !(wa.domains ?? []).some((d: Any) => d.measured > 0)) {
    return section('Wearable', 'Sleep & recovery', `<div class="empty">No wearable connected. Add WHOOP, Oura, Apple Health, or Garmin to unlock recovery, sleep, and strain tracking.</div>`);
  }
  const blocks = (wa.domains ?? []).filter((d: Any) => d.measured > 0).map((d: Any) => {
    const findings = (d.top_findings ?? []).slice(0, 4).map((f: Any) =>
      meter(f.name ?? f.marker ?? '', f.value ?? f.display ?? '', f.score ?? d.score, f.status ?? d.status)).join('');
    return `<div class="dom"><div class="dom-h"><span class="dom-n">${esc(d.name)}</span><span class="dom-s" style="color:${sc(d.status)}">${num(d.score)}</span></div>${findings || `<div class="dom-a">${esc((d.actions ?? [])[0] ?? '')}</div>`}</div>`;
  }).join('');
  return section('Wearable', 'Sleep & recovery', `<div class="grid2">${blocks}</div>`);
}

function healthMonitorSection(wa: Any): string {
  const preferred = ['hrv', 'resting_heart_rate', 'respiratory_rate', 'spo2', 'skin_temperature', 'blood_pressure', 'sleep_debt_minutes'];
  const findings = (wa?.findings ?? []) as Any[];
  const byId = new Map(findings.map((finding: Any) => [String(finding.id ?? '').toLowerCase(), finding]));
  const cards = preferred.map(id => byId.get(id)).filter(Boolean).map((f: Any) => `<article class="monitor">
    <div class="monitor-top"><span class="monitor-label">${esc(f.name)}</span><span class="monitor-state" style="color:${sc(f.status)}">${esc(f.status_label ?? f.status ?? '')}</span></div>
    <div class="monitor-value">${esc(f.value)} <small>${esc(f.unit ?? '')}</small></div>
    <div class="monitor-target">${esc(f.target_label ?? 'Personal baseline')}</div>
  </article>`).join('');
  if (!cards) return section('Health monitor', 'Baseline signals', `<div class="empty">No baseline-relative monitor signals are available yet. A connected wearable will add HRV, resting heart rate, respiratory rate, oxygen, temperature, and sleep-debt context here.</div>`);
  return section('Health monitor', 'Baseline signals', `<div class="monitor-grid">${cards}</div>`);
}

function healthContextSection(ctx: Any): string {
  const entries = Array.isArray(ctx) ? ctx : (ctx?.entries ?? ctx?.events ?? []);
  if (!entries.length) return section('Daily context', 'What changed today?', `<div class="empty">Add a quick note or tag for illness, travel, alcohol, stress, pain, schedule, or perceived exertion when the sensors do not explain the signal.</div>`);
  const cards = entries.slice(0, 6).map((entry: Any) => `<div class="ctx-entry"><span class="ctx-type">${esc(entry.context_type ?? entry.type ?? 'Check-in')}</span><span class="ctx-time">${esc(entry.recorded_at ?? entry.date ?? '')}</span><p>${esc(entry.value_or_note ?? entry.note ?? entry.value ?? '')}</p></div>`).join('');
  return section('Daily context', 'What changed today?', `<div class="context-list">${cards}</div>`);
}

function biomarkerSection(ba: Any): string {
  if (!ba || ba.status === 'missing' || ba.measured_count === 0) {
    return section('Biomarkers', 'Blood work', `<div class="empty">No blood panel connected. Add a biomarker export (ApoB, HbA1c, lipids, and more) to fuel the engine read.</div>`);
  }
  const bioAge = ba.biological_age ? `<div class="bioage"><span class="ba-l">Biological age</span><span class="ba-v">${esc(ba.biological_age.value ?? ba.biological_age)}</span></div>` : '';
  const blocks = (ba.domains ?? []).filter((d: Any) => d.measured > 0).map((d: Any) => {
    const findings = (d.top_findings ?? []).slice(0, 4).map((f: Any) => meter(f.name ?? f.marker ?? '', f.value ?? '', f.score ?? d.score, f.status ?? d.status)).join('');
    return `<div class="dom"><div class="dom-h"><span class="dom-n">${esc(d.name)}</span><span class="dom-s" style="color:${sc(d.status)}">${num(d.score)}</span></div>${findings || `<div class="dom-a">${esc((d.actions ?? [])[0] ?? '')}</div>`}</div>`;
  }).join('');
  return section('Biomarkers', 'Blood work', `${bioAge}<div class="grid2">${blocks}</div>`);
}

function edgesSection(strengths: Any[]): string {
  if (!strengths?.length) return '';
  const cards = strengths.slice(0, 6).map((s: Any) => `<div class="edge">
    <div class="edge-h"><span class="edge-t">${esc(s.title)}</span><span class="edge-sc">${num(s.score)}</span></div>
    <div class="edge-g">${esc(s.gene)}${s.rsid ? ` · ${esc(s.rsid)}` : ''}</div>
    <div class="mt sm"><i style="width:${clampPct(s.score)}%;background:var(--positive)"></i></div>
    <p class="edge-b">${esc(s.body)}</p>
    <div class="tags">${(s.tags ?? []).map((t: string) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>`).join('');
  return section('Genetics', 'Your genetic edges', `<div class="edges">${cards}</div>`);
}

function polygenicSection(prs: Any[]): string {
  if (!prs?.length) return '';
  const rows = prs.slice(0, 6).map((p: Any) => {
    const higher = String(p.band).toLowerCase().includes('high');
    return `<div class="prs"><div class="prs-h"><span class="prs-n">${esc(p.name)}</span><span class="prs-b" style="color:${higher ? 'var(--warning)' : 'var(--accent)'}">${esc(p.band)} · ${esc(p.pct)}%</span></div>
      <div class="prs-track"><span class="prs-fill" style="width:100%;background:linear-gradient(90deg,var(--accent),var(--surface-alt) 50%,var(--warning))"></span><span class="prs-dot" style="left:calc(${clampPct(p.pct)}% - 6px)"></span></div></div>`;
  }).join('');
  return section('Genetics', 'Polygenic risk', `<div class="prslist">${rows}</div>`);
}

function hallmarkSection(h: Any): string {
  const list = (h?.hallmarks ?? h) as Any[];
  if (!Array.isArray(list) || !list.length) return '';
  const chips = list.slice(0, 9).map((m: Any) => `<div class="hm"><div class="hm-h"><span>${esc(m.name)}</span><b>${num(m.burden)}</b></div>
    <div class="mt sm"><i style="width:${clampPct(m.burden)}%;background:${m.burden >= 66 ? 'var(--negative)' : m.burden >= 33 ? 'var(--warning)' : 'var(--positive)'}"></i></div>
    ${m.action ? `<div class="hm-a">${esc(m.action)}</div>` : ''}</div>`).join('');
  return section('Genetics', 'Aging hallmarks', `<div class="grid2">${chips}</div>`);
}

function contextSection(drugGene: Any[], hereditary: Any[]): string {
  const items = [...(drugGene ?? []), ...(hereditary ?? [])].slice(0, 6);
  if (!items.length) return '';
  const cards = items.map((c: Any) => `<div class="ctx"><div class="ctx-n">${esc(c.name)}</div><div class="ctx-g">${esc(c.gene)}${c.rsid ? ` · ${esc(c.rsid)}` : ''}</div><p class="ctx-d">${esc(c.lead ?? '')} ${esc(String(c.desc ?? '').slice(0, 160))}</p></div>`).join('');
  return section('Genetics', 'Discuss with a clinician', `<div class="grid2">${cards}</div><p class="note">Genetic context for a conversation with a clinician or pharmacist, not a diagnosis.</p>`);
}

function planSection(plan: Any): string {
  const pri = (plan?.priorities ?? []) as Any[];
  const focus = pri.length ? pri.slice(0, 3).map((p: Any, i: number) => `<div class="focus"><div class="focus-n">0${i + 1}</div>
    <div><div class="focus-t">${esc(p.title ?? p.headline)}</div>${(p.why ?? p.reasoning) ? `<div class="focus-w">${esc(p.why ?? p.reasoning)}</div>` : ''}
    ${(p.steps ?? []).length ? `<ul class="steps">${(p.steps ?? []).slice(0, 3).map((s: string) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}</div></div>`).join('')
    : `<div class="empty">No qualified priorities right now. Keep the maintenance items below and add the next data source to sharpen the plan.</div>`;
  const maintain = (plan?.maintain ?? []).slice(0, 4).map((m: Any) => `<li>${esc(m.title ?? m.text ?? m)}</li>`).join('');
  const review = (plan?.reviewItems ?? plan?.review ?? []).slice(0, 4).map((r: Any) => `<li>${esc(r.title ?? r.text ?? r)}</li>`).join('');
  return section('Action plan', plan?.summary ? 'Your focus' : 'Your focus',
    `${plan?.summary ? `<p class="lede">${esc(plan.summary)}</p>` : ''}<div class="focuslist">${focus}</div>
     ${maintain ? `<div class="sub"><h3>Maintain</h3><ul class="dl">${maintain}</ul></div>` : ''}
     ${review ? `<div class="sub"><h3>Retest</h3><ul class="dl">${review}</ul></div>` : ''}`);
}

export function renderPerformanceFull(d: Any, theme: DesignTokens): string {
  const { rootCss, fontsHref } = themeCss(theme);
  const hs = d.healthspan ?? {};
  const recovery = hs.gli ?? d.gli ?? d.score;
  const track = (d.tracking ?? []) as Any[];
  const strain = track[0]?.score;
  const hrv = track[1]?.score;
  const member = d.member?.initials ?? d.member?.name ?? '';
  const css = `
  *{margin:0;padding:0;box-sizing:border-box}
  ${rootCss}
  body{background:var(--background);color:var(--text);font-family:var(--font-body);-webkit-font-smoothing:antialiased}
  .wrap{max-width:1080px;margin:0 auto;padding:44px 26px 64px}
  @keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes gw{from{stroke-dasharray:0 999}to{stroke-dasharray:999 0}}
  @keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  .topbar{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:8px}
  .topbar .lbl{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--text-muted);font-weight:700}
  .topbar .who{font-size:12px;color:var(--text-muted);letter-spacing:.08em}
  .hero{text-align:center;padding:16px 0 6px}
  .band{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--negative),var(--warning),var(--positive));max-width:560px;margin:0 auto 22px;animation:grow 1.2s cubic-bezier(.22,1,.36,1) both;transform-origin:left}
  .gauges{display:flex;gap:44px;justify-content:center;flex-wrap:wrap;animation:fu .6s ease both}
  .gauge{position:relative;text-align:center}
  .gauge .arc{stroke-dasharray:999;animation:gw 1.3s cubic-bezier(.22,1,.36,1) both}
  .gv{position:absolute;top:58px;left:0;right:0;font-family:var(--font-display);font-size:44px;font-weight:800;letter-spacing:-.02em}
  .gl{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-muted);margin-top:2px;font-weight:700}
  .gs{font-size:12px;color:var(--text-muted);margin-top:2px}
  .chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:24px}
  .chip{font-size:11.5px;padding:6px 12px;border-radius:999px;border:1px solid var(--border);color:var(--text-muted);display:flex;gap:6px;align-items:center}
  .chip.on{color:var(--text)}.chip i{opacity:.6;font-style:normal}
  .sec{margin-top:44px;animation:fu .5s ease both}
  .sec-h{display:flex;align-items:baseline;gap:14px;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:18px}
  .sec-k{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--primary);font-weight:800}
  .sec-h h2{font-size:22px;font-weight:800;letter-spacing:-.01em}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .monitor-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .monitor{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,10px);padding:16px;min-height:112px}
  .monitor-top{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.monitor-label{font-size:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:700}.monitor-state{font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;text-align:right}.monitor-value{font-family:var(--font-display);font-size:28px;font-weight:800;margin-top:14px}.monitor-value small{font-family:var(--font-body);font-size:12px;color:var(--text-muted);font-weight:500}.monitor-target{font-size:11.5px;color:var(--text-muted);margin-top:5px}
  .context-list{display:flex;flex-direction:column}.ctx-entry{display:grid;grid-template-columns:150px 1fr;gap:10px;border-bottom:1px solid var(--border);padding:13px 0}.ctx-type{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--primary);font-weight:700}.ctx-time{font-size:11px;color:var(--text-muted);text-align:right}.ctx-entry p{grid-column:1/-1;font-size:13.5px;color:var(--text-muted);line-height:1.5}
  .dom{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,10px);padding:18px}
  .dom-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}
  .dom-n{font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:700}
  .dom-s{font-family:var(--font-display);font-size:24px;font-weight:800}
  .dom-a{font-size:13.5px;color:var(--text-muted);line-height:1.5}
  .mtr{margin:9px 0}.mh{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px}.mn{color:var(--text)}.mv{color:var(--text-muted);font-family:var(--font-mono,monospace)}
  .mt{height:7px;border-radius:4px;background:var(--surface-alt);overflow:hidden}.mt.sm{height:6px}
  .mt i{display:block;height:100%;border-radius:4px;transform-origin:left;animation:grow 1s cubic-bezier(.22,1,.36,1) both}
  .bioage{display:inline-flex;align-items:baseline;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:10px 18px;margin-bottom:16px}
  .ba-l{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)}.ba-v{font-family:var(--font-display);font-size:22px;font-weight:800}
  .edges{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .edge{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,10px);padding:18px;border-left:3px solid var(--positive)}
  .edge-h{display:flex;justify-content:space-between;align-items:baseline}.edge-t{font-weight:800;font-size:15px}.edge-sc{font-family:var(--font-display);font-weight:800;color:var(--positive)}
  .edge-g{font-size:12px;color:var(--text-muted);font-family:var(--font-mono,monospace);margin:2px 0 10px}
  .edge-b{font-size:13.5px;color:var(--text-muted);line-height:1.5;margin-top:10px}
  .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.tag{font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:4px;background:var(--surface-alt);color:var(--text-muted);font-weight:600}
  .prslist{display:flex;flex-direction:column;gap:16px}
  .prs-h{display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px}.prs-n{font-weight:700}.prs-b{font-size:12px;letter-spacing:.04em;text-transform:uppercase;font-weight:700}
  .prs-track{position:relative;height:8px;border-radius:999px;overflow:hidden}.prs-fill{position:absolute;inset:0;border-radius:999px;opacity:.5}
  .prs-dot{position:absolute;top:-3px;width:14px;height:14px;border-radius:50%;background:var(--text);border:2px solid var(--surface)}
  .hm{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,10px);padding:14px 16px}
  .hm-h{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px}.hm-h b{font-family:var(--font-display)}
  .hm-a{font-size:12.5px;color:var(--text-muted);margin-top:8px;line-height:1.4}
  .ctx{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md,10px);padding:16px}
  .ctx-n{font-weight:700;font-size:14px}.ctx-g{font-size:12px;color:var(--text-muted);font-family:var(--font-mono,monospace);margin:2px 0 8px}.ctx-d{font-size:13px;color:var(--text-muted);line-height:1.5}
  .note{font-size:12px;color:var(--text-muted);margin-top:12px;font-style:italic}
  .lede{color:var(--text-muted);font-size:15px;line-height:1.6;max-width:640px;margin-bottom:18px}
  .focuslist{display:flex;flex-direction:column;gap:14px}
  .focus{display:flex;gap:16px;border-left:3px solid var(--primary);padding:12px 0 12px 16px}
  .focus-n{font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--primary);line-height:1}
  .focus-t{font-weight:800;font-size:16px}.focus-w{color:var(--text-muted);font-size:14px;margin-top:4px;line-height:1.5}
  .steps{margin:10px 0 0 0;padding-left:18px}.steps li{font-size:13.5px;color:var(--text-muted);line-height:1.6}
  .sub{margin-top:24px}.sub h3{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-muted);font-weight:700;margin-bottom:8px}
  .dl li{list-style:none;padding:11px 0;border-bottom:1px solid var(--border);font-size:14px}
  .empty{background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-md,10px);padding:20px;font-size:14px;color:var(--text-muted);line-height:1.55}
  footer{margin-top:52px;padding-top:18px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted);line-height:1.6}
  @media (max-width:900px){.monitor-grid{grid-template-columns:repeat(2,1fr)}}
  @media (max-width:720px){.grid2,.edges,.monitor-grid{grid-template-columns:1fr}.ctx-entry{grid-template-columns:1fr}.ctx-time{text-align:left}.ctx-entry p{grid-column:auto}}
  `;
  const summary = d.plan?.summary ?? d.multimodal_plan?.summary ?? '';
  return `<!doctype html><html lang="en" data-design="performance"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Performance</title>
${fontsHref ? `<link rel="stylesheet" href="${fontsHref}">` : ''}<style>${css}</style></head><body><div class="wrap">
  <div class="topbar"><span class="lbl">Performance</span><span class="who">${esc(member)}</span></div>
  <section class="hero"><div class="band"></div>
    <div class="gauges">
      ${gauge('Recovery', recovery, 'g-rec', ['var(--negative)', 'var(--warning)', 'var(--positive)'], hs.gliStatus)}
      ${gauge('Strain', strain, 'g-str', ['var(--accent)', 'var(--primary)'], track[0]?.title)}
      ${gauge('HRV', hrv, 'g-hrv', ['var(--warning)', 'var(--positive)'], track[1]?.title)}
    </div>
    ${coverageChips(d.plan, hs)}</section>
  ${wearableSection(d.wearable_analysis)}
  ${healthMonitorSection(d.wearable_analysis)}
  ${biomarkerSection(d.biomarker_analysis)}
  ${edgesSection(d.strengths)}
  ${polygenicSection(d.polygenic)}
  ${hallmarkSection(d.hallmarks ?? d.hallmark)}
  ${contextSection(d.drugGene, d.hereditary)}
  ${healthContextSection(d.health_context ?? d.healthContext)}
  ${planSection(d.plan)}
  <footer>${esc(d.plan?.disclaimer ?? 'Educational longevity analysis. Not a diagnosis or medical advice. Confirm high-stakes findings with a clinician.')}</footer>
</div></body></html>`;
}
