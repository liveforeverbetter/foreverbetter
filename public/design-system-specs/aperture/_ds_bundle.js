/* @ds-bundle: {"format":4,"namespace":"ApertureDesignSystem_6066d1","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"ActivityRing","sourcePath":"components/data/ActivityRing.jsx"},{"name":"AreaChart","sourcePath":"components/data/AreaChart.jsx"},{"name":"MetricTile","sourcePath":"components/data/MetricTile.jsx"},{"name":"ProgressRing","sourcePath":"components/data/ProgressRing.jsx"},{"name":"RangeGauge","sourcePath":"components/data/RangeGauge.jsx"},{"name":"ScoreCard","sourcePath":"components/data/ScoreCard.jsx"},{"name":"InsightBanner","sourcePath":"components/feedback/InsightBanner.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"StatusPill","sourcePath":"components/feedback/StatusPill.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Input","sourcePath":"components/inputs/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/inputs/SegmentedControl.jsx"},{"name":"Switch","sourcePath":"components/inputs/Switch.jsx"},{"name":"Card","sourcePath":"components/layout/Card.jsx"},{"name":"ListItem","sourcePath":"components/layout/ListItem.jsx"},{"name":"Sidebar","sourcePath":"components/layout/Sidebar.jsx"},{"name":"TabBar","sourcePath":"components/layout/TabBar.jsx"},{"name":"TopBar","sourcePath":"components/layout/TopBar.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"a7a6cc769076","components/actions/IconButton.jsx":"618d98cabccc","components/actions/motion.js":"c54d97a66581","components/data/ActivityRing.jsx":"edcacc7a1bde","components/data/AreaChart.jsx":"d1a4ed508d96","components/data/MetricTile.jsx":"5e9d7da1251e","components/data/ProgressRing.jsx":"cb0e38f38869","components/data/RangeGauge.jsx":"8e3d4efb9b4e","components/data/ScoreCard.jsx":"1c83ce5420dd","components/feedback/InsightBanner.jsx":"180cf986aafb","components/feedback/Modal.jsx":"2ae00abc5feb","components/feedback/StatusPill.jsx":"f3cb3ee2c4b3","components/feedback/Toast.jsx":"5a3ad1fb1d2d","components/inputs/Input.jsx":"0599f3907a3e","components/inputs/SegmentedControl.jsx":"36d0135decec","components/inputs/Switch.jsx":"c8f0831f993c","components/layout/Card.jsx":"35c911cbc865","components/layout/ListItem.jsx":"6d0c69bb608a","components/layout/Sidebar.jsx":"70ad33062f0b","components/layout/TabBar.jsx":"1ec405648b22","components/layout/TopBar.jsx":"60112b0b8b18","ui_kits/aperture-app/AppActionPlan.jsx":"408971133f85","ui_kits/aperture-app/AppBiomarkers.jsx":"8bf288f9b12d","ui_kits/aperture-app/AppGenetics.jsx":"8b8bb56de36b","ui_kits/aperture-app/AppOverview.jsx":"affb6d1ae26d","ui_kits/aperture-app/AppWearables.jsx":"336480606d68","ui_kits/aperture-app/app-data.js":"a0e72445c5d7","ui_kits/aperture-dashboard/dash-views.jsx":"20a3f58c9291"},"inlinedExternals":[],"unexposedExports":[{"name":"prefersReducedMotion","sourcePath":"components/actions/motion.js"},{"name":"pressScale","sourcePath":"components/actions/motion.js"}]} */

(() => {

const __ds_ns = (window.ApertureDesignSystem_6066d1 = window.ApertureDesignSystem_6066d1 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/motion.js
try { (() => {
// Shared motion helper for Aperture components.
// Respects prefers-reduced-motion by disabling transform-based motion (opacity still allowed).
function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Returns a scale transform string, or "none" when the user prefers reduced motion.
function pressScale(active, amount = 0.97) {
  if (!active || prefersReducedMotion()) return "none";
  return `scale(${amount})`;
}
Object.assign(__ds_scope, { prefersReducedMotion, pressScale });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/motion.js", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 34,
    padding: "0 14px",
    font: "var(--fs-label)",
    radius: "var(--radius-sm)",
    gap: 6
  },
  md: {
    height: 42,
    padding: "0 18px",
    font: "var(--fs-body-sm)",
    radius: "var(--radius-md)",
    gap: 8
  },
  lg: {
    height: 52,
    padding: "0 24px",
    font: "var(--fs-body)",
    radius: "var(--radius-md)",
    gap: 8
  }
};
function palette(variant) {
  switch (variant) {
    case "primary":
      return {
        bg: "var(--btn-primary-bg)",
        fg: "var(--btn-primary-fg)",
        border: "transparent",
        hoverBg: "var(--btn-primary-bg-hover)",
        activeBg: "var(--btn-primary-bg-active)"
      };
    case "brand":
      return {
        bg: "var(--brand)",
        fg: "#fff",
        border: "transparent",
        hoverBg: "var(--brand-hover)",
        activeBg: "var(--brand-active)"
      };
    case "secondary":
      return {
        bg: "var(--surface-card)",
        fg: "var(--text-primary)",
        border: "var(--border-default)",
        hoverBg: "var(--surface-hover)",
        activeBg: "var(--brand-soft)"
      };
    case "soft":
      return {
        bg: "var(--brand-soft)",
        fg: "var(--text-brand)",
        border: "transparent",
        hoverBg: "var(--teal-100)",
        activeBg: "var(--teal-100)"
      };
    case "danger":
      return {
        bg: "var(--danger-500)",
        fg: "#fff",
        border: "transparent",
        hoverBg: "var(--danger-600)",
        activeBg: "var(--danger-700)"
      };
    case "ghost":
    default:
      return {
        bg: "transparent",
        fg: "var(--text-secondary)",
        border: "transparent",
        hoverBg: "var(--surface-hover)",
        activeBg: "var(--ink-100)"
      };
  }
}
function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth = false,
  disabled = false,
  children,
  style,
  onClick,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const p = palette(variant);
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const bg = disabled ? "var(--ink-100)" : active ? p.activeBg : hover ? p.hoverBg : p.bg;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: fullWidth ? "100%" : "auto",
      font: "inherit",
      fontFamily: "var(--font-body)",
      fontWeight: "var(--fw-semibold)",
      fontSize: s.font,
      lineHeight: 1,
      whiteSpace: "nowrap",
      color: disabled ? "var(--text-muted)" : p.fg,
      background: bg,
      border: `1.5px solid ${p.border === "transparent" ? bg : p.border}`,
      borderRadius: s.radius,
      cursor: disabled ? "not-allowed" : "pointer",
      transform: __ds_scope.pressScale(active && !disabled, 0.97),
      transition: "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: "1.15em",
      height: "1.15em"
    }
  }, icon), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: "1.15em",
      height: "1.15em"
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 34,
  md: 42,
  lg: 52
};
function IconButton({
  variant = "ghost",
  size = "md",
  label,
  children,
  active = false,
  disabled = false,
  style,
  onClick,
  ...rest
}) {
  const dim = SIZES[size] || SIZES.md;
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const tones = {
    ghost: {
      bg: "transparent",
      fg: "var(--text-secondary)",
      hover: "var(--surface-hover)"
    },
    soft: {
      bg: "var(--brand-soft)",
      fg: "var(--text-brand)",
      hover: "var(--teal-100)"
    },
    solid: {
      bg: "var(--ink-900)",
      fg: "#fff",
      hover: "var(--ink-800)"
    },
    outline: {
      bg: "var(--surface-card)",
      fg: "var(--text-secondary)",
      hover: "var(--surface-hover)"
    }
  };
  const t = tones[variant] || tones.ghost;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dim,
      height: dim,
      flex: `0 0 ${dim}px`,
      color: active ? "var(--text-brand)" : t.fg,
      background: active ? "var(--brand-soft)" : hover ? t.hover : t.bg,
      border: variant === "outline" ? "1.5px solid var(--border-default)" : "1.5px solid transparent",
      borderRadius: "var(--radius-full)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transform: __ds_scope.pressScale(pressed && !disabled, 0.94),
      transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: dim * 0.44,
      height: dim * 0.44
    }
  }, children));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/ActivityRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Concentric activity rings (Move/Exercise/Stand style).
 *  rings: [{ value, max, color }] — outermost first. */
function ActivityRing({
  rings = [],
  size = 120,
  thickness = 12,
  gap = 4,
  style,
  ...rest
}) {
  const center = size / 2;
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("g", {
    transform: `rotate(-90 ${center} ${center})`
  }, rings.map((ring, i) => {
    const r = center - thickness / 2 - i * (thickness + gap);
    if (r <= 0) return null;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(1, ring.value / ring.max));
    const dash = c * pct;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("circle", {
      cx: center,
      cy: center,
      r: r,
      fill: "none",
      stroke: ring.track || "var(--surface-sunken)",
      strokeWidth: thickness
    }), /*#__PURE__*/React.createElement("circle", {
      cx: center,
      cy: center,
      r: r,
      fill: "none",
      stroke: ring.color,
      strokeWidth: thickness,
      strokeLinecap: "round",
      strokeDasharray: `${dash} ${c - dash}`,
      style: {
        transition: "stroke-dasharray var(--dur-ring) var(--ease-out)"
      }
    }));
  })));
}
Object.assign(__ds_scope, { ActivityRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ActivityRing.jsx", error: String((e && e.message) || e) }); }

// components/data/AreaChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Lightweight SVG area chart with gradient fill and an optional target band.
 *  data: number[]. Renders on a 0-based value axis. */
function AreaChart({
  data = [],
  color = "var(--brand)",
  fillOpacity = 0.16,
  height = 160,
  min,
  max,
  targetBand,
  xLabels,
  yTicks = 3,
  smooth = true,
  style,
  ...rest
}) {
  const W = 320,
    H = 140,
    padL = 4,
    padR = 4,
    padT = 8,
    padB = 4;
  const lo = min != null ? min : Math.min(0, ...data);
  const hi = max != null ? max : Math.max(1, ...data) * 1.1;
  const gid = React.useMemo(() => "ac" + Math.random().toString(36).slice(2, 8), []);
  const xs = data.map((_, i) => padL + i / Math.max(1, data.length - 1) * (W - padL - padR));
  const ys = data.map(v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB));
  const pts = xs.map((x, i) => [x, ys[i]]);
  const line = smooth ? smoothPath(pts) : pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const area = line + ` L ${xs[xs.length - 1]} ${H - padB} L ${xs[0]} ${H - padB} Z`;
  const bandY = targetBand ? [padT + (1 - (targetBand[1] - lo) / (hi - lo)) * (H - padT - padB), padT + (1 - (targetBand[0] - lo) / (hi - lo)) * (H - padT - padB)] : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    height: height,
    preserveAspectRatio: "none",
    style: {
      display: "block",
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: fillOpacity
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), [...Array(yTicks)].map((_, i) => {
    const y = padT + i / (yTicks - 1) * (H - padT - padB);
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: padL,
      y1: y,
      x2: W - padR,
      y2: y,
      stroke: "var(--border-subtle)",
      strokeWidth: "1",
      vectorEffect: "non-scaling-stroke"
    });
  }), bandY && /*#__PURE__*/React.createElement("rect", {
    x: padL,
    y: bandY[0],
    width: W - padL - padR,
    height: Math.max(2, bandY[1] - bandY[0]),
    fill: "var(--ink-200)",
    opacity: "0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#${gid})`
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke"
  })), xLabels && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6,
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)"
    }
  }, xLabels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, l))));
}
function smoothPath(pts) {
  if (pts.length < 2) return pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i],
      [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}
Object.assign(__ds_scope, { AreaChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/AreaChart.jsx", error: String((e && e.message) || e) }); }

// components/data/MetricTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Compact metric tile: label, big value + unit, and a status pill.
 *  The workhorse of grid dashboards (heart-health sub-metrics, biomarker panels). */
function MetricTile({
  label,
  value,
  unit,
  status,
  statusTone = "good",
  icon,
  iconTone = "teal",
  hint,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: 16,
      minWidth: 0,
      boxShadow: hover && onClick ? "var(--shadow-card)" : "none",
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow var(--dur-base) var(--ease-out)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      borderRadius: "var(--radius-full)",
      background: `var(--${iconTone}-50)`,
      color: `var(--${iconTone}-500)`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 15,
      height: 15,
      display: "inline-flex"
    }
  }, icon)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-tertiary)",
      lineHeight: 1.25,
      textWrap: "pretty"
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h2)",
      color: "var(--text-primary)",
      letterSpacing: "var(--tracking-tight)"
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-muted)"
    }
  }, unit)), status && /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: "flex-start",
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-semibold)",
      color: `var(--score-${statusTone})`,
      background: `var(--score-${statusTone}-bg)`,
      borderRadius: "var(--radius-sm)",
      padding: "2px 8px"
    }
  }, status), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)"
    }
  }, hint));
}
Object.assign(__ds_scope, { MetricTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MetricTile.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Circular progress ring (SVG). Center content passed as children. */
function ProgressRing({
  value = 0,
  max = 100,
  size = 96,
  thickness = 10,
  color = "var(--brand)",
  track = "var(--surface-sunken)",
  rounded = true,
  children,
  style,
  ...rest
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = c * pct;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      width: size,
      height: size,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: track,
    strokeWidth: thickness
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: thickness,
    strokeLinecap: rounded ? "round" : "butt",
    strokeDasharray: `${dash} ${c - dash}`,
    style: {
      transition: "stroke-dasharray var(--dur-ring) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center"
    }
  }, children));
}
Object.assign(__ds_scope, { ProgressRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressRing.jsx", error: String((e && e.message) || e) }); }

// components/data/RangeGauge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Horizontal range gauge with an optimal band and a marker at `value` (0–1).
 *  Used for cardio load, vascular load, "balanced / injury risk" style readouts. */
function RangeGauge({
  value = 0.5,
  band = [0.35, 0.7],
  leftLabel,
  rightLabel,
  status,
  statusTone = "good",
  height = 12,
  style,
  ...rest
}) {
  const pos = Math.max(0, Math.min(1, value)) * 100;
  const b0 = Math.max(0, Math.min(1, band[0])) * 100;
  const b1 = Math.max(0, Math.min(1, band[1])) * 100;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), status && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h3)",
      color: `var(--score-${statusTone})`,
      marginBottom: 10
    }
  }, status), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height,
      borderRadius: "var(--radius-full)",
      background: "var(--surface-sunken)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: `${b0}%`,
      width: `${b1 - b0}%`,
      borderRadius: "var(--radius-full)",
      background: "repeating-linear-gradient(45deg, var(--ink-200) 0 4px, var(--ink-100) 4px 8px)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      left: `${pos}%`,
      transform: "translate(-50%,-50%)",
      width: height + 6,
      height: height + 6,
      borderRadius: "var(--radius-full)",
      background: `var(--score-${statusTone})`,
      border: "3px solid var(--surface-card)",
      boxShadow: "var(--shadow-sm)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 8,
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, leftLabel), /*#__PURE__*/React.createElement("span", null, rightLabel)));
}
Object.assign(__ds_scope, { RangeGauge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/RangeGauge.jsx", error: String((e && e.message) || e) }); }

// components/data/ScoreCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Hero score readout: big numeral, colored band label, delta chip, optional description.
 *  Renders its own tinted surface. */
function ScoreCard({
  score,
  max = 100,
  band,
  tone = "good",
  delta,
  unit,
  description,
  footer,
  radius = "xl",
  style,
  ...rest
}) {
  const toneC = `var(--score-${tone})`;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: `var(--score-${tone}-bg)`,
      color: "var(--text-primary)",
      borderRadius: `var(--radius-${radius})`,
      padding: 24,
      boxShadow: "var(--shadow-card)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-xbold)",
      fontSize: "var(--fs-score)",
      lineHeight: 1,
      letterSpacing: "var(--tracking-tight)"
    }
  }, score, unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-h3)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-tertiary)",
      marginLeft: 4
    }
  }, unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      paddingTop: 6
    }
  }, delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      alignSelf: "flex-start",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--fs-caption)",
      fontWeight: 700,
      color: delta >= 0 ? "var(--success-600)" : "var(--danger-600)",
      background: "var(--surface-card)",
      borderRadius: "var(--radius-full)",
      padding: "2px 8px"
    }
  }, delta >= 0 ? "▲" : "▼", " ", Math.abs(delta)), band && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h3)",
      color: toneC
    }
  }, band))), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "14px 0 0",
      fontSize: "var(--fs-body-sm)",
      lineHeight: "var(--lh-normal)",
      color: "var(--text-secondary)"
    }
  }, description), footer);
}
Object.assign(__ds_scope, { ScoreCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ScoreCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/InsightBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The big conversational insight card ("Incredible yesterday!", "Heart signals under pressure").
 *  Gradient or tinted surface, optional leading icon cluster, title, body, and carousel dots. */
function InsightBanner({
  eyebrow,
  title,
  body,
  icon,
  tone = "teal",
  gradient,
  glow = false,
  dots,
  activeDot = 0,
  action,
  style,
  ...rest
}) {
  const bg = gradient || `var(--${tone}-50)`;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      background: bg,
      borderRadius: "var(--radius-2xl)",
      padding: 22,
      boxShadow: glow ? "var(--aura-teal)" : "var(--shadow-card)",
      overflow: "hidden",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 44,
      height: 44,
      borderRadius: "var(--radius-lg)",
      marginBottom: 14,
      background: `var(--${tone}-500)`,
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      display: "inline-flex"
    }
  }, icon)), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      fontWeight: 700,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: `var(--${tone}-700)`,
      marginBottom: 6
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h2)",
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-primary)"
    }
  }, title), body && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "10px 0 0",
      fontSize: "var(--fs-body-sm)",
      lineHeight: "var(--lh-normal)",
      color: "var(--text-secondary)"
    }
  }, body), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, action), dots != null && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 16
    }
  }, [...Array(dots)].map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: i === activeDot ? 18 : 6,
      height: 6,
      borderRadius: 999,
      background: i === activeDot ? `var(--${tone}-500)` : `var(--${tone}-200, var(--ink-200))`,
      transition: "width var(--dur-base) var(--ease-out)"
    }
  }))));
}
Object.assign(__ds_scope, { InsightBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/InsightBanner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Centered modal (desktop) / bottom sheet (mobile via `sheet`). Renders its own scrim.
 *  Uncontrolled visibility handled by parent (render only when open). */
function Modal({
  title,
  subtitle,
  children,
  actions,
  onClose,
  sheet = false,
  width = 440,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: sheet ? "flex-end" : "center",
      justifyContent: "center",
      background: "rgba(14,16,19,0.38)",
      backdropFilter: "blur(2px)",
      padding: sheet ? 0 : 24
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    onClick: e => e.stopPropagation(),
    style: {
      width: sheet ? "100%" : width,
      maxWidth: "100%",
      maxHeight: "88vh",
      overflowY: "auto",
      background: "var(--surface-card)",
      borderRadius: sheet ? "var(--radius-2xl) var(--radius-2xl) 0 0" : "var(--radius-2xl)",
      padding: 24,
      boxShadow: "var(--shadow-pop)",
      animation: `${sheet ? "apSheet" : "apPop"} var(--dur-slow) var(--ease-out)`,
      ...style
    }
  }, rest), sheet && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      borderRadius: 999,
      background: "var(--border-strong)",
      margin: "-6px auto 16px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h2)",
      letterSpacing: "var(--tracking-tight)"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, subtitle)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      border: "none",
      background: "var(--surface-hover)",
      width: 34,
      height: 34,
      borderRadius: "var(--radius-full)",
      cursor: "pointer",
      color: "var(--text-secondary)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 34px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: title ? 18 : 0
    }
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 22,
      justifyContent: "flex-end"
    }
  }, actions)), /*#__PURE__*/React.createElement("style", null, `@keyframes apPop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}@keyframes apSheet{from{transform:translateY(100%)}to{transform:none}}`));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  excellent: "excellent",
  good: "good",
  fair: "fair",
  attention: "attention",
  success: "good",
  warning: "fair",
  danger: "attention",
  info: "excellent"
};

/** Small status pill / badge. tone maps to score/semantic colors. */
function StatusPill({
  tone = "good",
  variant = "soft",
  size = "md",
  icon,
  children,
  style,
  ...rest
}) {
  const key = TONES[tone] || "good";
  const fg = `var(--score-${key})`;
  const bg = `var(--score-${key}-bg)`;
  const sz = size === "sm" ? {
    fontSize: "var(--fs-micro)",
    padding: "2px 8px",
    gap: 4
  } : {
    fontSize: "var(--fs-caption)",
    padding: "3px 10px",
    gap: 5
  };
  const styles = variant === "solid" ? {
    background: fg,
    color: "#fff",
    border: "1px solid transparent"
  } : variant === "outline" ? {
    background: "transparent",
    color: fg,
    border: `1.5px solid ${fg}`
  } : {
    background: bg,
    color: fg,
    border: "1px solid transparent"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: sz.gap,
      padding: sz.padding,
      fontFamily: "var(--font-body)",
      fontWeight: "var(--fw-semibold)",
      fontSize: sz.fontSize,
      lineHeight: 1,
      borderRadius: "var(--radius-full)",
      whiteSpace: "nowrap",
      ...styles,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: "1em",
      height: "1em"
    }
  }, icon), children);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Brief non-blocking toast. tone-colored leading dot/icon, title, optional message + action. */
function Toast({
  tone = "good",
  title,
  message,
  icon,
  action,
  onDismiss,
  style,
  ...rest
}) {
  const key = {
    success: "good",
    warning: "fair",
    danger: "attention",
    info: "excellent"
  }[tone] || tone;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      width: 360,
      maxWidth: "100%",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "14px 16px",
      boxShadow: "var(--shadow-pop)",
      animation: "apToastIn var(--dur-slow) var(--ease-out)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      flex: "0 0 28px",
      borderRadius: "var(--radius-full)",
      background: `var(--score-${key}-bg)`,
      color: `var(--score-${key})`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      display: "inline-flex"
    }
  }, icon || /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-primary)"
    }
  }, title), message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-label)",
      color: "var(--text-tertiary)",
      marginTop: 2
    }
  }, message), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      border: "none",
      background: "transparent",
      color: "var(--text-muted)",
      cursor: "pointer",
      padding: 2,
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x"
  }))), /*#__PURE__*/React.createElement("style", null, `@keyframes apToastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){@keyframes apToastIn{from{opacity:0}to{opacity:1}}}`));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Text input with optional label, leading icon, hint, and error. */
function Input({
  label,
  icon,
  hint,
  error,
  id,
  style,
  wrapStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const rid = id || React.useId();
  const border = error ? "var(--danger-500)" : focus ? "var(--border-brand)" : "var(--border-default)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...wrapStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: rid,
    style: {
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-secondary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 46,
      padding: "0 14px",
      background: "var(--surface-card)",
      border: `1.5px solid ${border}`,
      borderRadius: "var(--radius-md)",
      boxShadow: focus ? "0 0 0 3px var(--focus-ring)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)"
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: 18,
      height: 18,
      color: "var(--text-muted)"
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    id: rid,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-body)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-primary)",
      minWidth: 0,
      ...style
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: error ? "var(--danger-600)" : "var(--text-muted)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Input.jsx", error: String((e && e.message) || e) }); }

// components/inputs/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Segmented control / pill tabs. options: [{id,label,icon}] or [{id,icon}] for icon-only.
 *  Used for time-range toggles (Day/Week/Month) and the app's top icon-tab row. */
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  iconOnly = false,
  style,
  ...rest
}) {
  const pad = size === "sm" ? "6px 12px" : "9px 16px";
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: "inline-flex",
      gap: 4,
      padding: 4,
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-full)",
      ...style
    }
  }, rest), options.map(o => {
    const on = o.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      role: "tab",
      "aria-selected": on,
      "aria-label": o.label,
      onClick: () => onChange && onChange(o.id),
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: iconOnly ? 0 : pad,
        width: iconOnly ? size === "sm" ? 34 : 40 : "auto",
        height: iconOnly ? size === "sm" ? 34 : 40 : "auto",
        border: "none",
        borderRadius: "var(--radius-full)",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-label)",
        fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
        background: on ? "var(--surface-card)" : "transparent",
        color: on ? "var(--text-primary)" : "var(--text-tertiary)",
        boxShadow: on ? "var(--shadow-xs)" : "none",
        transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)"
      }
    }, o.icon && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        width: 18,
        height: 18
      }
    }, o.icon), !iconOnly && o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** On/off switch. Controlled via checked + onChange. */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  style,
  ...rest
}) {
  const dims = size === "sm" ? {
    w: 38,
    h: 22,
    k: 16
  } : {
    w: 46,
    h: 27,
    k: 21
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      position: "relative",
      width: dims.w,
      height: dims.h,
      flex: `0 0 ${dims.w}px`,
      padding: 0,
      border: "none",
      borderRadius: "var(--radius-full)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      background: checked ? "var(--brand)" : "var(--ink-200)",
      transition: "background var(--dur-base) var(--ease-out)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: (dims.h - dims.k) / 2,
      left: checked ? dims.w - dims.k - (dims.h - dims.k) / 2 : (dims.h - dims.k) / 2,
      width: dims.k,
      height: dims.k,
      borderRadius: "var(--radius-full)",
      background: "#fff",
      boxShadow: "var(--shadow-sm)",
      transition: "left var(--dur-base) var(--ease-out)"
    }
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Switch.jsx", error: String((e && e.message) || e) }); }

// components/layout/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  none: {
    bg: "var(--surface-card)",
    fg: "var(--text-primary)"
  },
  teal: {
    bg: "var(--teal-50)",
    fg: "var(--teal-700)"
  },
  sleep: {
    bg: "var(--sleep-50)",
    fg: "var(--sleep-700)"
  },
  activity: {
    bg: "var(--activity-50)",
    fg: "var(--activity-700)"
  },
  nutrition: {
    bg: "var(--nutrition-50)",
    fg: "var(--nutrition-700)"
  },
  mind: {
    bg: "var(--mind-50)",
    fg: "var(--mind-700)"
  },
  vitals: {
    bg: "var(--vitals-50)",
    fg: "var(--vitals-700)"
  },
  heart: {
    bg: "var(--heart-50)",
    fg: "var(--heart-700)"
  },
  excellent: {
    bg: "var(--score-excellent-bg)",
    fg: "var(--score-excellent)"
  },
  good: {
    bg: "var(--score-good-bg)",
    fg: "var(--score-good)"
  },
  fair: {
    bg: "var(--score-fair-bg)",
    fg: "var(--score-fair)"
  },
  attention: {
    bg: "var(--score-attention-bg)",
    fg: "var(--score-attention)"
  }
};
const RADII = {
  md: "var(--radius-lg)",
  lg: "var(--radius-xl)",
  xl: "var(--radius-2xl)"
};
const PADS = {
  sm: 16,
  md: 20,
  lg: 24
};
function Card({
  tone = "none",
  radius = "lg",
  padding = "md",
  glow,
  interactive = false,
  gradient,
  children,
  style,
  onClick,
  ...rest
}) {
  const t = TONES[tone] || TONES.none;
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const tappable = interactive || onClick;
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let transform = "none";
  if (!reduce) {
    if (tappable && pressed) transform = "scale(0.985)";else if (interactive && hover) transform = "translateY(-2px)";
  }
  const bg = gradient ? gradient : t.bg;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onMouseDown: () => tappable && setPressed(true),
    onMouseUp: () => setPressed(false),
    style: {
      position: "relative",
      background: bg,
      color: tone === "none" ? "var(--text-primary)" : t.fg,
      borderRadius: RADII[radius] || RADII.lg,
      padding: typeof padding === "number" ? padding : PADS[padding] || PADS.md,
      border: tone === "none" ? "1px solid var(--border-subtle)" : "1px solid transparent",
      boxShadow: glow ? "var(--aura-teal)" : "var(--shadow-card)",
      cursor: interactive || onClick ? "pointer" : "default",
      transform,
      transition: "transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Card.jsx", error: String((e && e.message) || e) }); }

// components/layout/ListItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A single row: leading icon chip, title/subtitle, trailing value + chevron. */
function ListItem({
  icon,
  iconTone = "teal",
  title,
  subtitle,
  value,
  valueUnit,
  trailing,
  chevron = false,
  onClick,
  divider = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const toneVar = `var(--${iconTone}-500)`;
  const toneBg = `var(--${iconTone}-50)`;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 8px",
      borderRadius: "var(--radius-md)",
      background: onClick && hover ? "var(--surface-hover)" : "transparent",
      borderBottom: divider ? "1px solid var(--border-subtle)" : "none",
      cursor: onClick ? "pointer" : "default",
      transition: "background var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      flex: "0 0 40px",
      borderRadius: "var(--radius-full)",
      background: toneBg,
      color: toneVar
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: 20,
      height: 20
    }
  }, icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-primary)"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-label)",
      color: "var(--text-tertiary)",
      marginTop: 2
    }
  }, subtitle)), value != null && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontFamily: "var(--font-mono)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-primary)"
    }
  }, value, valueUnit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-muted)",
      marginLeft: 3
    }
  }, valueUnit)), trailing, chevron && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: 18,
      height: 18,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-right"
  })));
}
Object.assign(__ds_scope, { ListItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/ListItem.jsx", error: String((e && e.message) || e) }); }

// components/layout/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Desktop dashboard sidebar. brand string + nav items + optional footer node.
 *  items: [{ id, label, icon, badge }]. Sections via items with `section: true`. */
function Sidebar({
  brand = "Aperture",
  items = [],
  active,
  onSelect,
  footer,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("aside", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      width: "var(--sidebar-w)",
      flex: "0 0 var(--sidebar-w)",
      height: "100%",
      padding: "22px 16px",
      boxSizing: "border-box",
      background: "var(--surface-card)",
      borderRight: "1px solid var(--border-subtle)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 10px 22px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--grad-brand)",
      color: "#fff",
      flex: "0 0 30px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 17,
      height: 17,
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "aperture"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-xbold)",
      fontSize: 19,
      letterSpacing: "var(--tracking-tight)"
    }
  }, brand)), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      flex: 1
    }
  }, items.map(it => {
    if (it.section) return /*#__PURE__*/React.createElement("div", {
      key: it.label,
      style: {
        padding: "16px 12px 6px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".05em",
        textTransform: "uppercase",
        color: "var(--text-muted)"
      }
    }, it.label);
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onSelect && onSelect(it.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        padding: "10px 12px",
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-body-sm)",
        fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
        background: on ? "var(--brand-soft)" : "transparent",
        color: on ? "var(--text-brand)" : "var(--text-secondary)",
        transition: "background var(--dur-fast) var(--ease-out)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        width: 19,
        height: 19
      }
    }, it.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, it.label), it.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        background: on ? "var(--teal-100)" : "var(--ink-100)",
        color: on ? "var(--teal-700)" : "var(--text-tertiary)",
        borderRadius: "var(--radius-full)",
        padding: "1px 8px"
      }
    }, it.badge));
  })), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 14,
      borderTop: "1px solid var(--border-subtle)"
    }
  }, footer));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/layout/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Mobile bottom tab bar. items: [{ id, label, icon }]. Floating pill style. */
function TabBar({
  items = [],
  active,
  onSelect,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      gap: 4,
      height: 60,
      padding: "0 10px",
      margin: "0 16px 14px",
      background: "var(--surface-card)",
      borderRadius: "var(--radius-full)",
      boxShadow: "var(--shadow-raised)",
      ...style
    }
  }, rest), items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onSelect && onSelect(it.id),
      "aria-label": it.label,
      style: {
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        flex: 1,
        height: 48,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: on ? "var(--text-brand)" : "var(--text-muted)",
        transition: "color var(--dur-fast) var(--ease-out)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        width: 22,
        height: 22
      }
    }, it.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)"
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/layout/TopBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** App top bar — optional back button, title, and trailing action nodes. */
function TopBar({
  title,
  onBack,
  leading,
  actions,
  large = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      height: "var(--topbar-h)",
      padding: "0 var(--gutter-app)",
      background: "transparent",
      ...style
    }
  }, rest), onBack && /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 38,
      height: 38,
      marginLeft: -6,
      border: "none",
      background: "transparent",
      color: "var(--text-primary)",
      cursor: "pointer",
      borderRadius: "var(--radius-full)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-left"
  }))), leading, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      flex: 1,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--fw-bold)",
      letterSpacing: "var(--tracking-tight)",
      fontSize: large ? "var(--fs-h1)" : "var(--fs-h3)",
      color: "var(--text-primary)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, actions));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aperture-app/AppActionPlan.jsx
try { (() => {
const {
  Card,
  InsightBanner,
  StatusPill,
  ListItem,
  Button,
  ProgressRing
} = window.ApertureDesignSystem_6066d1;
const AP = (n, s = 20) => /*#__PURE__*/React.createElement("i", {
  "data-lucide": n,
  style: {
    width: s,
    height: s
  }
});
function AppActionPlan({
  go
}) {
  const d = window.APERTURE.actionPlan;
  const [tasks, setTasks] = React.useState(d.tasks);
  const done = tasks.filter(t => t.done).length;
  const toggle = id => setTasks(ts => ts.map(t => t.id === id ? {
    ...t,
    done: !t.done
  } : t));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "4px 2px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "Personalized for you"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: "-0.02em"
    }
  }, "Action plan"))), /*#__PURE__*/React.createElement(Card, {
    gradient: "var(--grad-dawn)",
    radius: "2xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    value: done,
    max: tasks.length,
    size: 78,
    thickness: 9,
    color: "var(--teal-500)"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 22
    }
  }, done, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)"
    }
  }, "/", tasks.length))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: "var(--teal-700)",
      marginBottom: 4
    }
  }, "Today"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      lineHeight: 1.25
    }
  }, d.focus)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, "Today's actions"), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "sm"
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes apCheckIn{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){@keyframes apCheckIn{from{opacity:0}to{opacity:1}}}`), tasks.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    onClick: () => toggle(t.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 8px",
      cursor: "pointer",
      borderBottom: i < tasks.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      flex: "0 0 26px",
      borderRadius: 999,
      border: t.done ? "none" : "2px solid var(--border-strong)",
      background: t.done ? `var(--${t.tone}-500)` : "transparent",
      color: "#fff",
      transition: "background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)"
    }
  }, t.done && /*#__PURE__*/React.createElement("span", {
    key: "c",
    style: {
      display: "inline-flex",
      animation: "apCheckIn var(--dur-base) var(--ease-out)"
    }
  }, AP("check", 15))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 14,
      color: t.done ? "var(--text-muted)" : "var(--text-primary)",
      textDecoration: t.done ? "line-through" : "none"
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-tertiary)",
      marginTop: 2
    }
  }, t.meta)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      borderRadius: 999,
      background: `var(--${t.tone}-50)`,
      color: `var(--${t.tone}-500)`
    }
  }, AP(t.icon, 17)))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, "Why these actions"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, d.recommendations.map((r, i) => /*#__PURE__*/React.createElement(Card, {
    key: i,
    tone: r.tone === "heart" ? "heart" : r.tone,
    radius: "xl",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      flex: "0 0 40px",
      borderRadius: 12,
      background: `var(--${r.tone}-500)`,
      color: "#fff"
    }
  }, AP(r.icon)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 15,
      color: "var(--text-primary)"
    }
  }, r.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 4,
      lineHeight: 1.45
    }
  }, r.body))))))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    icon: AP("sparkles")
  }, "Regenerate my plan"));
}
window.AppActionPlan = AppActionPlan;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aperture-app/AppActionPlan.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aperture-app/AppBiomarkers.jsx
try { (() => {
const {
  Card,
  ScoreCard,
  MetricTile,
  StatusPill,
  AreaChart,
  Button
} = window.ApertureDesignSystem_6066d1;
const AB = (n, s = 20) => /*#__PURE__*/React.createElement("i", {
  "data-lucide": n,
  style: {
    width: s,
    height: s
  }
});
function AppBiomarkers({
  go
}) {
  const d = window.APERTURE.biomarkers;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 2px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, d.lastDraw), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: "-0.02em"
    }
  }, "Biomarkers")), /*#__PURE__*/React.createElement(Card, {
    radius: "2xl",
    padding: "lg",
    glow: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 6
    }
  }, "Antioxidant Index"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 48,
      lineHeight: 1
    }
  }, d.antioxidant.value), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(StatusPill, {
    tone: "good"
  }, d.antioxidant.band)))), /*#__PURE__*/React.createElement(StatusPill, {
    tone: "good",
    variant: "soft",
    icon: AB("trending-up", 13)
  }, "+", d.antioxidant.delta)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(AreaChart, {
    data: d.antioxidant.trend,
    color: "var(--activity-500)",
    height: 90,
    yTicks: 2,
    xLabels: ["6 wk ago", "now"]
  }))), d.panels.map(panel => /*#__PURE__*/React.createElement("div", {
    key: panel.group
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, panel.group), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, panel.items.map(it => /*#__PURE__*/React.createElement(MetricTile, {
    key: it.label,
    label: it.label,
    value: it.value,
    unit: it.unit,
    status: it.status,
    statusTone: it.statusTone,
    hint: `Range ${it.range}`
  }))))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    fullWidth: true,
    icon: AB("file-text")
  }, "View full lab report"));
}
window.AppBiomarkers = AppBiomarkers;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aperture-app/AppBiomarkers.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aperture-app/AppGenetics.jsx
try { (() => {
const {
  Card,
  StatusPill,
  ListItem,
  Button
} = window.ApertureDesignSystem_6066d1;
const AG = (n, s = 20) => /*#__PURE__*/React.createElement("i", {
  "data-lucide": n,
  style: {
    width: s,
    height: s
  }
});
function AppGenetics({
  go
}) {
  const d = window.APERTURE.genetics;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 2px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "DNA insights"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: "-0.02em"
    }
  }, "Genetics")), /*#__PURE__*/React.createElement(Card, {
    gradient: "var(--grad-vitality)",
    radius: "2xl",
    padding: "lg",
    style: {
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: 22,
      height: 22
    }
  }, AG("dna", 22)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 15
    }
  }, "Whole-genome analysis")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      opacity: 0.92,
      lineHeight: 1.5
    }
  }, d.summary), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 28
    }
  }, d.traits), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.85
    }
  }, "Traits")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 28
    }
  }, d.markers.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.85
    }
  }, "Risk markers")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, "Genetic risk highlights"), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "sm"
  }, d.highlights.map((h, i) => /*#__PURE__*/React.createElement(ListItem, {
    key: h.trait,
    icon: AG(h.icon),
    iconTone: h.tone === "attention" ? "vitals" : h.tone === "fair" ? "nutrition" : "activity",
    title: h.trait,
    subtitle: h.detail,
    trailing: /*#__PURE__*/React.createElement(StatusPill, {
      tone: h.tone,
      size: "sm"
    }, h.risk),
    divider: i < d.highlights.length - 1,
    chevron: true,
    onClick: () => {}
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, "Ancestry composition"), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 14,
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 16
    }
  }, d.ancestry.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.region,
    style: {
      width: `${a.pct}%`,
      background: a.color
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, d.ancestry.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.region,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: a.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14,
      fontWeight: 500
    }
  }, a.region), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      fontSize: 14
    }
  }, a.pct, "%")))))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    fullWidth: true,
    iconRight: AG("chevron-right")
  }, "Explore all 340 traits"));
}
window.AppGenetics = AppGenetics;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aperture-app/AppGenetics.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aperture-app/AppOverview.jsx
try { (() => {
const {
  Card,
  ScoreCard,
  InsightBanner,
  MetricTile,
  ActivityRing,
  ProgressRing,
  StatusPill,
  ListItem,
  SegmentedControl,
  IconButton
} = window.ApertureDesignSystem_6066d1;
const AI = (n, s = 20) => /*#__PURE__*/React.createElement("i", {
  "data-lucide": n,
  style: {
    width: s,
    height: s
  }
});
function AppOverview({
  go
}) {
  const d = window.APERTURE.overview;
  const u = window.APERTURE.user;
  const [tab, setTab] = React.useState("overview");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "4px 2px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, d.date), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 24,
      letterSpacing: "-0.02em"
    }
  }, d.greeting)), /*#__PURE__*/React.createElement(IconButton, {
    label: "Search",
    variant: "ghost"
  }, AI("search")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 999,
      background: "var(--grad-vitality)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: 14
    }
  }, u.initials)), /*#__PURE__*/React.createElement(SegmentedControl, {
    iconOnly: true,
    value: tab,
    onChange: setTab,
    options: [{
      id: "overview",
      label: "Overview",
      icon: AI("layout-grid", 18)
    }, {
      id: "activity",
      label: "Activity",
      icon: AI("footprints", 18)
    }, {
      id: "sleep",
      label: "Sleep",
      icon: AI("moon", 18)
    }, {
      id: "nutrition",
      label: "Nutrition",
      icon: AI("apple", 18)
    }, {
      id: "mind",
      label: "Mind",
      icon: AI("brain", 18)
    }, {
      id: "vitals",
      label: "Vitals",
      icon: AI("heart-pulse", 18)
    }],
    style: {
      width: "100%",
      justifyContent: "space-between"
    }
  }), /*#__PURE__*/React.createElement(InsightBanner, {
    gradient: "var(--grad-mesh)",
    glow: true,
    eyebrow: "Aperture insight",
    title: d.insight.title,
    body: d.insight.body,
    dots: 3,
    activeDot: 0
  }), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 4
    }
  }, "Energy score"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 52,
      lineHeight: 1,
      letterSpacing: "-0.02em"
    }
  }, d.energy), /*#__PURE__*/React.createElement(StatusPill, {
    tone: "good",
    style: {
      marginBottom: 8
    }
  }, d.energyBand))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, [38, 55, 82, 70, 60, 75, 82].map((v, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: i === 6 ? "var(--score-good)" : i === 2 ? "var(--sleep-400)" : "var(--ink-200)"
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "md",
    interactive: true,
    onClick: () => go("wearables")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 10
    }
  }, "Daily activity"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 0 6px"
    }
  }, /*#__PURE__*/React.createElement(ActivityRing, {
    size: 104,
    rings: d.rings.map(r => ({
      value: r.value,
      max: r.max,
      color: r.color
    }))
  }))), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "md",
    interactive: true,
    onClick: () => go("wearables")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 10
    }
  }, "Sleep score"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 0 6px"
    }
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    value: 84,
    size: 104,
    color: "var(--sleep-500)"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 30
    }
  }, "84"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-tertiary)"
    }
  }, "7h 12m"))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      margin: "4px 2px 10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18
    }
  }, "Your pillars"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-brand)",
      fontWeight: 600
    }
  }, "See all")), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "sm"
  }, d.pillars.map((p, i) => /*#__PURE__*/React.createElement(ListItem, {
    key: p.id,
    icon: AI(p.icon),
    iconTone: p.tone,
    title: p.label,
    subtitle: p.status,
    value: p.value,
    divider: i < d.pillars.length - 1,
    onClick: () => go("actionplan"),
    chevron: true
  })))));
}
window.AppOverview = AppOverview;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aperture-app/AppOverview.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aperture-app/AppWearables.jsx
try { (() => {
const {
  Card,
  ScoreCard,
  MetricTile,
  StatusPill,
  ListItem,
  Switch,
  AreaChart,
  RangeGauge,
  InsightBanner
} = window.ApertureDesignSystem_6066d1;
const AW = (n, s = 20) => /*#__PURE__*/React.createElement("i", {
  "data-lucide": n,
  style: {
    width: s,
    height: s
  }
});
function VitalsColumns({
  signals
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
      height: 150
    }
  }, signals.map((s, i) => {
    const bad = s.status === "high";
    const h = bad ? 150 : 108 - i % 2 * 14;
    const col = bad ? "var(--vitals-50)" : "var(--sleep-50)";
    const chip = bad ? "var(--vitals-500)" : "var(--sleep-500)";
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: {
        flex: 1,
        height: h,
        borderRadius: 999,
        background: col,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 999,
        background: chip,
        color: "#fff"
      }
    }, AW(s.icon, 17)), bad && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 999,
        background: "var(--vitals-500)",
        color: "#fff"
      }
    }, AW("activity", 15)));
  }));
}
function AppWearables({
  go
}) {
  const w = window.APERTURE.wearables;
  const v = window.APERTURE.vitals;
  const h = window.APERTURE.heart;
  const c = window.APERTURE.cardio;
  const [devices, setDevices] = React.useState(w.devices);
  const toggle = i => setDevices(ds => ds.map((d, j) => j === i ? {
    ...d,
    connected: !d.connected
  } : d));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 2px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "Devices & overnight signals"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: "-0.02em"
    }
  }, "Wearables")), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: "var(--heart-500)"
    }
  }, AW("heart-pulse", 18)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 15
    }
  }, "Live heart rate")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 24
    }
  }, w.liveHr), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, "bpm"))), /*#__PURE__*/React.createElement(AreaChart, {
    data: w.hrSeries,
    color: "var(--heart-500)",
    height: 72,
    yTicks: 2
  })), /*#__PURE__*/React.createElement(Card, {
    radius: "2xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      color: "var(--vitals-700)",
      marginBottom: 14
    }
  }, v.outOfRange, " out of range"), /*#__PURE__*/React.createElement(VitalsColumns, {
    signals: v.signals
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      marginTop: 18
    }
  }, v.headline), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px 0 0",
      fontSize: 14,
      color: "var(--text-secondary)",
      lineHeight: 1.5
    }
  }, v.body)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, "Heart Health Score"), /*#__PURE__*/React.createElement(ScoreCard, {
    score: h.score,
    band: h.band,
    tone: "good",
    delta: h.delta,
    description: h.description,
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginTop: 16
      }
    }, h.metrics.slice(0, 2).map(m => /*#__PURE__*/React.createElement("div", {
      key: m.label,
      style: {
        background: "var(--surface-card)",
        borderRadius: 14,
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-tertiary)"
      }
    }, m.label), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 4,
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 20
      }
    }, m.value)), /*#__PURE__*/React.createElement(StatusPill, {
      tone: m.statusTone,
      size: "sm",
      style: {
        marginTop: 6
      }
    }, m.status))))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, "Daily cardio load"), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 12
    }
  }, "2 workouts today"), /*#__PURE__*/React.createElement(AreaChart, {
    data: c.today,
    color: "var(--activity-500)",
    targetBand: [20, 30],
    height: 120,
    xLabels: c.labels
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(RangeGauge, {
    status: c.status,
    statusTone: "good",
    value: c.position,
    band: c.band,
    leftLabel: "Under",
    rightLabel: "Injury risk"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "14px 0 0",
      fontSize: 13,
      color: "var(--text-secondary)",
      lineHeight: 1.5
    }
  }, c.note))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      margin: "2px 2px 10px"
    }
  }, "Connected devices"), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "sm"
  }, devices.map((dv, i) => /*#__PURE__*/React.createElement(ListItem, {
    key: dv.name,
    icon: AW(dv.icon),
    iconTone: dv.tone,
    title: dv.name,
    subtitle: dv.detail,
    divider: i < devices.length - 1,
    trailing: /*#__PURE__*/React.createElement(Switch, {
      checked: dv.connected,
      onChange: () => toggle(i),
      size: "sm"
    })
  })))));
}
window.AppWearables = AppWearables;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aperture-app/AppWearables.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aperture-app/app-data.js
try { (() => {
// Shared mock data for the Aperture UI kits (mobile app + web dashboard).
// Attaches to window so both plain and babel scripts can read it.
window.APERTURE = {
  user: {
    name: "Maya",
    initials: "MR",
    plan: "Aperture Complete"
  },
  overview: {
    greeting: "Good morning, Maya",
    date: "Tuesday, July 14",
    insight: {
      title: "Your recovery is trending up",
      body: "HRV rose 8% this week and your resting heart rate is at a 30-day low. Your body is adapting well — a good window to push training."
    },
    energy: 82,
    energyBand: "Good",
    rings: [{
      label: "Move",
      value: 520,
      max: 600,
      unit: "kcal",
      color: "var(--activity-500)"
    }, {
      label: "Exercise",
      value: 42,
      max: 45,
      unit: "min",
      color: "var(--heart-500)"
    }, {
      label: "Steps",
      value: 9204,
      max: 10000,
      unit: "",
      color: "var(--sleep-500)"
    }],
    pillars: [{
      id: "sleep",
      label: "Sleep",
      icon: "moon",
      tone: "sleep",
      value: "7h 12m",
      status: "Good",
      statusTone: "good"
    }, {
      id: "activity",
      label: "Activity",
      icon: "footprints",
      tone: "activity",
      value: "9,204",
      status: "On track",
      statusTone: "good"
    }, {
      id: "nutrition",
      label: "Nutrition",
      icon: "apple",
      tone: "nutrition",
      value: "1,840",
      status: "Under",
      statusTone: "fair"
    }, {
      id: "mind",
      label: "Mindfulness",
      icon: "brain",
      tone: "mind",
      value: "12 min",
      status: "Good",
      statusTone: "good"
    }]
  },
  vitals: {
    outOfRange: 2,
    signals: [{
      id: "hr",
      label: "Heart rate",
      icon: "heart",
      tone: "vitals",
      status: "high"
    }, {
      id: "hrv",
      label: "HRV",
      icon: "activity",
      tone: "vitals",
      status: "high"
    }, {
      id: "spo2",
      label: "Blood oxygen",
      icon: "wind",
      tone: "sleep",
      status: "ok"
    }, {
      id: "temp",
      label: "Skin temp",
      icon: "thermometer",
      tone: "sleep",
      status: "ok"
    }, {
      id: "resp",
      label: "Respiration",
      icon: "waves",
      tone: "sleep",
      status: "ok"
    }],
    headline: "Heart signals under pressure",
    body: "Your heart rate increased while HRV decreased overnight. This can happen with stress, fatigue, or not enough rest. Slowing down and reducing physical or mental load may help your body settle.",
    metrics: [{
      label: "Resting heart rate",
      value: "62",
      unit: "bpm",
      status: "High",
      statusTone: "attention",
      icon: "heart",
      tone: "vitals"
    }, {
      label: "HRV",
      value: "38",
      unit: "ms",
      status: "Low",
      statusTone: "attention",
      icon: "activity",
      tone: "vitals"
    }, {
      label: "Blood oxygen",
      value: "98",
      unit: "%",
      status: "Normal",
      statusTone: "good",
      icon: "wind",
      tone: "sleep"
    }, {
      label: "Skin temp",
      value: "+0.2",
      unit: "°C",
      status: "Normal",
      statusTone: "good",
      icon: "thermometer",
      tone: "sleep"
    }]
  },
  heart: {
    score: 77,
    band: "Good",
    delta: 2,
    description: "Your heart health score is good. Vascular load is a critical part of your score — a diet high in potassium can help keep it under control. Consider adding bananas, oranges, or spinach for a natural boost.",
    metrics: [{
      label: "7-day sleep average",
      value: "6h 41m",
      status: "Good",
      statusTone: "good",
      icon: "moon",
      tone: "sleep"
    }, {
      label: "7-day moderate–vigorous activity",
      value: "1h 30m",
      status: "Fair",
      statusTone: "fair",
      icon: "flame",
      tone: "activity"
    }, {
      label: "Vascular load",
      value: "Moderate",
      status: "Fair",
      statusTone: "fair",
      icon: "gauge",
      tone: "vitals"
    }, {
      label: "BMI",
      value: "22.4",
      status: "Healthy",
      statusTone: "good",
      icon: "scale",
      tone: "nutrition"
    }]
  },
  cardio: {
    status: "Balanced",
    position: 0.55,
    band: [0.4, 0.72],
    today: [2, 2, 3, 3, 4, 9, 18, 22, 24, 24],
    labels: ["12 AM", "6 AM", "12 PM", "6 PM"],
    note: "Your recent cardio load is in line with your usual training level, so training and recovery are well balanced. This range safely improves fitness while keeping injury risk low.",
    fitnessIndex: {
      value: 48,
      unit: "VO₂max",
      band: "Excellent",
      percentile: "Top 15% for your age",
      delta: 1
    }
  },
  actionPlan: {
    focus: "This week's focus: rebuild sleep consistency",
    progress: 3,
    total: 5,
    tasks: [{
      id: 1,
      title: "Wind down by 10:30pm",
      tone: "sleep",
      icon: "moon",
      done: true,
      meta: "5-day streak"
    }, {
      id: 2,
      title: "Add 20g of fiber at breakfast",
      tone: "nutrition",
      icon: "apple",
      done: true,
      meta: "Antioxidant Index +4"
    }, {
      id: 3,
      title: "Zone 2 cardio, 30 min",
      tone: "activity",
      icon: "footprints",
      done: true,
      meta: "Cardio load balanced"
    }, {
      id: 4,
      title: "10-minute breathwork",
      tone: "mind",
      icon: "brain",
      done: false,
      meta: "Lowers overnight HR"
    }, {
      id: 5,
      title: "Log an afternoon BP reading",
      tone: "vitals",
      icon: "heart-pulse",
      done: false,
      meta: "Improves heart score"
    }],
    recommendations: [{
      title: "Shift caffeine earlier",
      body: "Your last coffee averaged 3:40pm this week. Moving it before noon could add ~25 min of deep sleep.",
      tone: "sleep",
      icon: "coffee"
    }, {
      title: "Raise potassium intake",
      body: "Vascular load is limiting your heart score. Aim for 3,500mg/day.",
      tone: "heart",
      icon: "heart"
    }]
  },
  genetics: {
    summary: "Your DNA was analyzed across 340 traits and 1,200+ risk markers.",
    highlights: [{
      trait: "Cardiovascular disease",
      risk: "Slightly elevated",
      tone: "fair",
      detail: "1.3× average · 12 markers",
      icon: "heart"
    }, {
      trait: "Type 2 diabetes",
      risk: "Average",
      tone: "good",
      detail: "0.9× average · 28 markers",
      icon: "droplet"
    }, {
      trait: "Caffeine metabolism",
      risk: "Slow metabolizer",
      tone: "fair",
      detail: "CYP1A2 variant",
      icon: "coffee"
    }, {
      trait: "Vitamin D",
      risk: "Prone to deficiency",
      tone: "attention",
      detail: "GC + VDR variants",
      icon: "sun"
    }, {
      trait: "Lactose tolerance",
      risk: "Tolerant",
      tone: "good",
      detail: "MCM6 variant",
      icon: "milk"
    }],
    ancestry: [{
      region: "Northern European",
      pct: 46,
      color: "var(--sleep-500)"
    }, {
      region: "Southern European",
      pct: 28,
      color: "var(--teal-500)"
    }, {
      region: "West African",
      pct: 18,
      color: "var(--nutrition-500)"
    }, {
      region: "East Asian",
      pct: 8,
      color: "var(--mind-500)"
    }],
    traits: 340,
    markers: 1240
  },
  biomarkers: {
    lastDraw: "Drawn June 28 · Quest Diagnostics",
    panels: [{
      group: "Metabolic",
      items: [{
        label: "Fasting glucose",
        value: "88",
        unit: "mg/dL",
        status: "Optimal",
        statusTone: "excellent",
        range: "70–99"
      }, {
        label: "HbA1c",
        value: "5.2",
        unit: "%",
        status: "Optimal",
        statusTone: "excellent",
        range: "<5.7"
      }, {
        label: "AGEs Index",
        value: "1.8",
        unit: "AU",
        status: "Good",
        statusTone: "good",
        range: "<2.0"
      }]
    }, {
      group: "Lipids",
      items: [{
        label: "LDL cholesterol",
        value: "128",
        unit: "mg/dL",
        status: "Borderline",
        statusTone: "fair",
        range: "<100"
      }, {
        label: "HDL cholesterol",
        value: "58",
        unit: "mg/dL",
        status: "Optimal",
        statusTone: "excellent",
        range: ">40"
      }, {
        label: "Triglycerides",
        value: "92",
        unit: "mg/dL",
        status: "Good",
        statusTone: "good",
        range: "<150"
      }]
    }, {
      group: "Inflammation & nutrients",
      items: [{
        label: "hs-CRP",
        value: "0.6",
        unit: "mg/L",
        status: "Optimal",
        statusTone: "excellent",
        range: "<1.0"
      }, {
        label: "Vitamin D",
        value: "24",
        unit: "ng/mL",
        status: "Low",
        statusTone: "attention",
        range: "30–50"
      }, {
        label: "Ferritin",
        value: "68",
        unit: "ng/mL",
        status: "Good",
        statusTone: "good",
        range: "30–200"
      }]
    }],
    antioxidant: {
      value: 74,
      band: "Good",
      delta: 4,
      trend: [60, 62, 61, 66, 68, 70, 74]
    }
  },
  wearables: {
    devices: [{
      name: "Aperture Ring",
      detail: "Worn now · 84% battery",
      icon: "circle-dot",
      connected: true,
      tone: "teal"
    }, {
      name: "Chest strap ECG",
      detail: "Synced 2h ago",
      icon: "heart-pulse",
      connected: true,
      tone: "heart"
    }, {
      name: "Smart scale",
      detail: "Last reading yesterday",
      icon: "scale",
      connected: true,
      tone: "nutrition"
    }, {
      name: "Continuous glucose monitor",
      detail: "Not connected",
      icon: "droplet",
      connected: false,
      tone: "activity"
    }],
    liveHr: 72,
    hrSeries: [70, 71, 69, 72, 74, 73, 71, 70, 72, 75, 78, 74, 72],
    sleepStages: {
      deep: 92,
      rem: 108,
      light: 214,
      awake: 18
    },
    steps: 9204
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aperture-app/app-data.js", error: String((e && e.message) || e) }); }

// ui_kits/aperture-dashboard/dash-views.jsx
try { (() => {
const D = window.ApertureDesignSystem_6066d1;
const {
  Card,
  ScoreCard,
  MetricTile,
  InsightBanner,
  ActivityRing,
  ProgressRing,
  RangeGauge,
  AreaChart,
  StatusPill,
  ListItem,
  Button,
  Switch
} = D;
const DI = (n, s = 20) => /*#__PURE__*/React.createElement("i", {
  "data-lucide": n,
  style: {
    width: s,
    height: s
  }
});
const A = window.APERTURE;
function Header({
  eyebrow,
  title,
  actions
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: 22,
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 4
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: "-0.02em"
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, actions));
}
function Section({
  title,
  children,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18
    }
  }, title), right), children);
}

/* ---------------- OVERVIEW ---------------- */
function DashOverview({
  go
}) {
  const d = A.overview;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Header, {
    eyebrow: d.date,
    title: d.greeting,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: DI("calendar", 18)
    }, "Today"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: DI("plus", 18)
    }, "Log a reading"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 18,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(InsightBanner, {
    gradient: "var(--grad-mesh)",
    glow: true,
    eyebrow: "Aperture insight",
    title: d.insight.title,
    body: d.insight.body,
    dots: 3,
    activeDot: 0
  }), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "lg",
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "Energy score"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 10,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 56,
      lineHeight: 1
    }
  }, d.energy), /*#__PURE__*/React.createElement(StatusPill, {
    tone: "good",
    style: {
      marginBottom: 12
    }
  }, d.energyBand)), /*#__PURE__*/React.createElement(AreaChart, {
    data: [62, 58, 70, 66, 74, 78, 82],
    color: "var(--score-good)",
    height: 60,
    yTicks: 2,
    style: {
      marginTop: 8
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 14,
      marginBottom: 22
    }
  }, d.pillars.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.id,
    radius: "lg",
    padding: "md",
    interactive: true,
    onClick: () => go("actionplan")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: 999,
      background: `var(--${p.tone}-50)`,
      color: `var(--${p.tone}-500)`
    }
  }, DI(p.icon, 18)), /*#__PURE__*/React.createElement(StatusPill, {
    tone: p.statusTone,
    size: "sm"
  }, p.status)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, p.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 26,
      marginTop: 2
    }
  }, p.value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1.3fr",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "lg",
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 12,
      textAlign: "left"
    }
  }, "Daily activity"), /*#__PURE__*/React.createElement(ActivityRing, {
    size: 140,
    rings: d.rings.map(r => ({
      value: r.value,
      max: r.max,
      color: r.color
    }))
  })), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "lg",
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 12,
      textAlign: "left"
    }
  }, "Sleep score"), /*#__PURE__*/React.createElement(ProgressRing, {
    value: 84,
    size: 140,
    thickness: 13,
    color: "var(--sleep-500)"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 38
    }
  }, "84"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-tertiary)"
    }
  }, "7h 12m"))), /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 4
    }
  }, "Today's cardio load"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      color: "var(--score-good)",
      marginBottom: 10
    }
  }, "Balanced"), /*#__PURE__*/React.createElement(AreaChart, {
    data: A.cardio.today,
    color: "var(--activity-500)",
    targetBand: [20, 30],
    height: 110,
    xLabels: A.cardio.labels
  }))));
}

/* ---------------- ACTION PLAN ---------------- */
function DashActionPlan({
  go
}) {
  const d = A.actionPlan;
  const [tasks, setTasks] = React.useState(d.tasks);
  const done = tasks.filter(t => t.done).length;
  const toggle = id => setTasks(ts => ts.map(t => t.id === id ? {
    ...t,
    done: !t.done
  } : t));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Header, {
    eyebrow: "Personalized for you",
    title: "Action plan",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: DI("sparkles", 18)
    }, "Regenerate plan")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Card, {
    gradient: "var(--grad-dawn)",
    radius: "2xl",
    padding: "lg",
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    value: done,
    max: tasks.length,
    size: 86,
    thickness: 10,
    color: "var(--teal-500)"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 24
    }
  }, done, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: "var(--text-muted)"
    }
  }, "/", tasks.length))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: "var(--teal-700)",
      marginBottom: 4
    }
  }, "This week's focus"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 20,
      lineHeight: 1.25
    }
  }, d.focus)))), /*#__PURE__*/React.createElement(Section, {
    title: "Today's actions"
  }, /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "sm"
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes apCheckIn{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){@keyframes apCheckIn{from{opacity:0}to{opacity:1}}}`), tasks.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    onClick: () => toggle(t.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "13px 10px",
      cursor: "pointer",
      borderBottom: i < tasks.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      flex: "0 0 26px",
      borderRadius: 999,
      border: t.done ? "none" : "2px solid var(--border-strong)",
      background: t.done ? `var(--${t.tone}-500)` : "transparent",
      color: "#fff",
      transition: "background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)"
    }
  }, t.done && /*#__PURE__*/React.createElement("span", {
    key: "c",
    style: {
      display: "inline-flex",
      animation: "apCheckIn var(--dur-base) var(--ease-out)"
    }
  }, DI("check", 15))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: 999,
      background: `var(--${t.tone}-50)`,
      color: `var(--${t.tone}-500)`
    }
  }, DI(t.icon, 17)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 15,
      color: t.done ? "var(--text-muted)" : "var(--text-primary)",
      textDecoration: t.done ? "line-through" : "none"
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-tertiary)",
      marginTop: 2
    }
  }, t.meta))))))), /*#__PURE__*/React.createElement(Section, {
    title: "Why these actions"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, d.recommendations.map((r, i) => /*#__PURE__*/React.createElement(Card, {
    key: i,
    tone: r.tone,
    radius: "xl",
    padding: "md"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 42,
      height: 42,
      borderRadius: 12,
      background: `var(--${r.tone}-500)`,
      color: "#fff",
      marginBottom: 12
    }
  }, DI(r.icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 16
    }
  }, r.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-secondary)",
      marginTop: 6,
      lineHeight: 1.5
    }
  }, r.body)))))));
}

/* ---------------- GENETICS ---------------- */
function DashGenetics({
  go
}) {
  const d = A.genetics;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Header, {
    eyebrow: "DNA insights",
    title: "Genetics",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: DI("download", 18)
    }, "Export raw data")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Card, {
    gradient: "var(--grad-vitality)",
    radius: "2xl",
    padding: "lg",
    style: {
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12
    }
  }, DI("dna", 22), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 16
    }
  }, "Whole-genome analysis")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      opacity: 0.92,
      lineHeight: 1.5
    }
  }, d.summary), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 36,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 34
    }
  }, d.traits), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      opacity: 0.85
    }
  }, "Traits analyzed")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 34
    }
  }, d.markers.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      opacity: 0.85
    }
  }, "Risk markers")))), /*#__PURE__*/React.createElement(Card, {
    radius: "2xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      marginBottom: 16
    }
  }, "Ancestry composition"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 16,
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 18
    }
  }, d.ancestry.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.region,
    style: {
      width: `${a.pct}%`,
      background: a.color
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px 20px"
    }
  }, d.ancestry.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.region,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: a.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14,
      fontWeight: 500
    }
  }, a.region), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      fontSize: 14
    }
  }, a.pct, "%")))))), /*#__PURE__*/React.createElement(Section, {
    title: "Genetic risk highlights",
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--text-brand)",
        fontWeight: 600,
        cursor: "pointer"
      }
    }, "Explore all 340 traits")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 14
    }
  }, d.highlights.map(h => /*#__PURE__*/React.createElement(Card, {
    key: h.trait,
    radius: "xl",
    padding: "md",
    interactive: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderRadius: 999,
      background: `var(--${h.tone === "attention" ? "vitals" : h.tone === "fair" ? "nutrition" : "activity"}-50)`,
      color: `var(--${h.tone === "attention" ? "vitals" : h.tone === "fair" ? "nutrition" : "activity"}-500)`
    }
  }, DI(h.icon)), /*#__PURE__*/React.createElement(StatusPill, {
    tone: h.tone,
    size: "sm"
  }, h.risk)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 16
    }
  }, h.trait), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginTop: 4
    }
  }, h.detail))))));
}

/* ---------------- BIOMARKERS ---------------- */
function DashBiomarkers({
  go
}) {
  const d = A.biomarkers;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Header, {
    eyebrow: d.lastDraw,
    title: "Biomarkers",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: DI("file-text", 18)
    }, "Lab report"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: DI("plus", 18)
    }, "Add results"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: 18,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Card, {
    radius: "2xl",
    padding: "lg",
    glow: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "Antioxidant Index"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 10,
      margin: "6px 0 4px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 54,
      lineHeight: 1
    }
  }, d.antioxidant.value), /*#__PURE__*/React.createElement(StatusPill, {
    tone: "good",
    variant: "soft",
    icon: DI("trending-up", 13),
    style: {
      marginBottom: 12
    }
  }, "+", d.antioxidant.delta)), /*#__PURE__*/React.createElement(StatusPill, {
    tone: "good"
  }, d.antioxidant.band), /*#__PURE__*/React.createElement(AreaChart, {
    data: d.antioxidant.trend,
    color: "var(--activity-500)",
    height: 80,
    yTicks: 2,
    style: {
      marginTop: 14
    },
    xLabels: ["6 wk ago", "now"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateRows: "auto auto",
      gap: 14
    }
  }, d.panels.map(panel => /*#__PURE__*/React.createElement("div", {
    key: panel.group
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-secondary)",
      marginBottom: 10
    }
  }, panel.group), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12
    }
  }, panel.items.map(it => /*#__PURE__*/React.createElement(MetricTile, {
    key: it.label,
    label: it.label,
    value: it.value,
    unit: it.unit,
    status: it.status,
    statusTone: it.statusTone,
    hint: `Range ${it.range}`
  }))))))));
}

/* ---------------- WEARABLES ---------------- */
function DashWearables({
  go
}) {
  const w = A.wearables,
    v = A.vitals,
    h = A.heart,
    c = A.cardio;
  const [devices, setDevices] = React.useState(w.devices);
  const toggle = i => setDevices(ds => ds.map((d, j) => j === i ? {
    ...d,
    connected: !d.connected
  } : d));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Header, {
    eyebrow: "Devices & overnight signals",
    title: "Wearables",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: DI("plus", 18)
    }, "Connect device")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.3fr 1fr",
      gap: 18,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Card, {
    radius: "xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--heart-500)",
      display: "inline-flex"
    }
  }, DI("heart-pulse", 18)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, "Live heart rate")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 26
    }
  }, w.liveHr), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "bpm"))), /*#__PURE__*/React.createElement(AreaChart, {
    data: w.hrSeries,
    color: "var(--heart-500)",
    height: 90,
    yTicks: 2
  })), /*#__PURE__*/React.createElement(Card, {
    radius: "2xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 16,
      color: "var(--vitals-700)",
      marginBottom: 14
    }
  }, v.outOfRange, " out of range overnight"), /*#__PURE__*/React.createElement(VitalsRow, {
    signals: v.signals
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(ScoreCard, {
    score: h.score,
    band: h.band,
    tone: "good",
    delta: h.delta,
    description: h.description,
    radius: "2xl"
  }), /*#__PURE__*/React.createElement(Card, {
    radius: "2xl",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 16,
      marginBottom: 4
    }
  }, "Daily cardio load"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginBottom: 12
    }
  }, "2 workouts today"), /*#__PURE__*/React.createElement(AreaChart, {
    data: c.today,
    color: "var(--activity-500)",
    targetBand: [20, 30],
    height: 100,
    xLabels: c.labels
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(RangeGauge, {
    status: c.status,
    statusTone: "good",
    value: c.position,
    band: c.band,
    leftLabel: "Under",
    rightLabel: "Injury risk"
  })))), /*#__PURE__*/React.createElement(Section, {
    title: "Connected devices"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, devices.map((dv, i) => /*#__PURE__*/React.createElement(Card, {
    key: dv.name,
    radius: "lg",
    padding: "md"
  }, /*#__PURE__*/React.createElement(ListItem, {
    icon: DI(dv.icon),
    iconTone: dv.tone,
    title: dv.name,
    subtitle: dv.detail,
    trailing: /*#__PURE__*/React.createElement(Switch, {
      checked: dv.connected,
      onChange: () => toggle(i)
    })
  }))))));
}
function VitalsRow({
  signals
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
      height: 130
    }
  }, signals.map((s, i) => {
    const bad = s.status === "high";
    const hgt = bad ? 130 : 96 - i % 2 * 12;
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: {
        flex: 1,
        height: hgt,
        borderRadius: 999,
        background: bad ? "var(--vitals-50)" : "var(--sleep-50)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 999,
        background: bad ? "var(--vitals-500)" : "var(--sleep-500)",
        color: "#fff"
      }
    }, DI(s.icon, 16)), bad && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 999,
        background: "var(--vitals-500)",
        color: "#fff"
      }
    }, DI("activity", 13)));
  }));
}
window.DASH = {
  overview: DashOverview,
  actionplan: DashActionPlan,
  genetics: DashGenetics,
  biomarkers: DashBiomarkers,
  wearables: DashWearables
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aperture-dashboard/dash-views.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ActivityRing = __ds_scope.ActivityRing;

__ds_ns.AreaChart = __ds_scope.AreaChart;

__ds_ns.MetricTile = __ds_scope.MetricTile;

__ds_ns.ProgressRing = __ds_scope.ProgressRing;

__ds_ns.RangeGauge = __ds_scope.RangeGauge;

__ds_ns.ScoreCard = __ds_scope.ScoreCard;

__ds_ns.InsightBanner = __ds_scope.InsightBanner;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ListItem = __ds_scope.ListItem;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.TopBar = __ds_scope.TopBar;

})();
