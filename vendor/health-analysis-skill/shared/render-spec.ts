/**
 * Minimal, white-label dashboard renderer. Takes a normalized dashboard spec
 * (cards + optional overall score) and a resolved theme, and returns a
 * self-contained themed HTML page. No brand names, no external assets beyond
 * optional Google Fonts. Used by cloud mode and as a fallback renderer.
 */
import { resolveTheme, themeCss, type DesignTokens } from './design/theme.js';

export interface SpecCard {
  title: string;
  category?: string;
  score?: number;
  status?: string;
  summary?: string;
  action?: string;
}

export interface DashboardSpec {
  title?: string;
  score?: number;
  cards: SpecCard[];
  disclaimer?: string;
}

const STATUS_TOKEN: Record<string, string> = {
  optimal: 'positive', good: 'positive', ok: 'positive',
  watch: 'warning', upcoming: 'warning',
  needs_attention: 'negative', high: 'negative', low: 'negative',
  missing: 'text-muted', not_connected: 'text-muted',
};

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function renderDashboardSpec(spec: DashboardSpec, design?: string | DesignTokens): string {
  const theme = resolveTheme(design);
  const { rootCss, fontsHref } = themeCss(theme);
  const scoreColor = (s?: string) => `var(--${STATUS_TOKEN[String(s ?? '').toLowerCase()] ?? 'primary'})`;

  const cards = spec.cards.map(card => `
    <article class="card">
      <div class="card-top">
        <span class="card-title">${esc(card.title)}</span>
        ${card.score != null ? `<span class="card-score">${esc(card.score)}</span>` : ''}
      </div>
      ${card.status ? `<div class="bar"><i style="width:${Math.max(6, Math.min(100, Number(card.score ?? 0)))}%;background:${scoreColor(card.status)}"></i></div>
      <div class="card-status" style="color:${scoreColor(card.status)}">${esc(String(card.status).replace(/_/g, ' '))}</div>` : ''}
      ${card.summary ? `<p class="card-summary">${esc(card.summary)}</p>` : ''}
      ${card.action ? `<p class="card-action">${esc(card.action)}</p>` : ''}
    </article>`).join('');

  return `<!doctype html>
<html lang="en" data-theme="${esc(theme.id)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title ?? 'Health dashboard')}</title>
${fontsHref ? `<link rel="stylesheet" href="${fontsHref}">` : ''}
<style>
${rootCss}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: var(--background); color: var(--text); font-family: var(--font-body); padding: 40px 20px; }
.wrap { max-width: 1080px; margin: 0 auto; }
header { margin-bottom: 32px; }
h1 { font-family: var(--font-display); font-size: 34px; letter-spacing: -0.02em; }
.overall { display: inline-flex; align-items: baseline; gap: 10px; margin-top: 8px; }
.overall b { font-family: var(--font-display); font-size: 44px; color: var(--primary); }
.overall span { color: var(--text-muted); font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px 22px; box-shadow: var(--shadow, none); }
.card-top { display: flex; justify-content: space-between; align-items: baseline; }
.card-title { font-weight: 600; font-size: 17px; }
.card-score { font-size: 20px; color: var(--primary); }
.bar { margin: 14px 0 8px; height: 8px; border-radius: 999px; background: var(--surface-alt); overflow: hidden; }
.bar i { display: block; height: 100%; border-radius: 999px; }
.card-status { font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; }
.card-summary { margin-top: 12px; font-size: 14px; line-height: 1.55; color: var(--text-muted); }
.card-action { margin-top: 10px; font-size: 14px; line-height: 1.5; }
footer { margin-top: 32px; font-size: 12px; color: var(--text-muted); }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${esc(spec.title ?? 'Your health dashboard')}</h1>
      ${spec.score != null ? `<div class="overall"><b>${esc(spec.score)}</b><span>overall</span></div>` : ''}
    </header>
    <div class="grid">${cards}</div>
    <footer>${esc(spec.disclaimer ?? 'Educational wellness analysis. Not a diagnosis or medical advice. Confirm high-stakes findings with a clinician.')}</footer>
  </div>
</body>
</html>`;
}
