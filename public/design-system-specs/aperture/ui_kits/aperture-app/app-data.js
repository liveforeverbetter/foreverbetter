// Shared mock data for the Aperture UI kits (mobile app + web dashboard).
// Attaches to window so both plain and babel scripts can read it.
window.APERTURE = {
  user: { name: "Maya", initials: "MR", plan: "Aperture Complete" },

  overview: {
    greeting: "Good morning, Maya",
    date: "Tuesday, July 14",
    insight: {
      title: "Your recovery is trending up",
      body: "HRV rose 8% this week and your resting heart rate is at a 30-day low. Your body is adapting well — a good window to push training.",
    },
    energy: 82,
    energyBand: "Good",
    rings: [
      { label: "Move", value: 520, max: 600, unit: "kcal", color: "var(--activity-500)" },
      { label: "Exercise", value: 42, max: 45, unit: "min", color: "var(--heart-500)" },
      { label: "Steps", value: 9204, max: 10000, unit: "", color: "var(--sleep-500)" },
    ],
    pillars: [
      { id: "sleep", label: "Sleep", icon: "moon", tone: "sleep", value: "7h 12m", status: "Good", statusTone: "good" },
      { id: "activity", label: "Activity", icon: "footprints", tone: "activity", value: "9,204", status: "On track", statusTone: "good" },
      { id: "nutrition", label: "Nutrition", icon: "apple", tone: "nutrition", value: "1,840", status: "Under", statusTone: "fair" },
      { id: "mind", label: "Mindfulness", icon: "brain", tone: "mind", value: "12 min", status: "Good", statusTone: "good" },
    ],
  },

  vitals: {
    outOfRange: 2,
    signals: [
      { id: "hr", label: "Heart rate", icon: "heart", tone: "vitals", status: "high" },
      { id: "hrv", label: "HRV", icon: "activity", tone: "vitals", status: "high" },
      { id: "spo2", label: "Blood oxygen", icon: "wind", tone: "sleep", status: "ok" },
      { id: "temp", label: "Skin temp", icon: "thermometer", tone: "sleep", status: "ok" },
      { id: "resp", label: "Respiration", icon: "waves", tone: "sleep", status: "ok" },
    ],
    headline: "Heart signals under pressure",
    body: "Your heart rate increased while HRV decreased overnight. This can happen with stress, fatigue, or not enough rest. Slowing down and reducing physical or mental load may help your body settle.",
    metrics: [
      { label: "Resting heart rate", value: "62", unit: "bpm", status: "High", statusTone: "attention", icon: "heart", tone: "vitals" },
      { label: "HRV", value: "38", unit: "ms", status: "Low", statusTone: "attention", icon: "activity", tone: "vitals" },
      { label: "Blood oxygen", value: "98", unit: "%", status: "Normal", statusTone: "good", icon: "wind", tone: "sleep" },
      { label: "Skin temp", value: "+0.2", unit: "°C", status: "Normal", statusTone: "good", icon: "thermometer", tone: "sleep" },
    ],
  },

  heart: {
    score: 77, band: "Good", delta: 2,
    description: "Your heart health score is good. Vascular load is a critical part of your score — a diet high in potassium can help keep it under control. Consider adding bananas, oranges, or spinach for a natural boost.",
    metrics: [
      { label: "7-day sleep average", value: "6h 41m", status: "Good", statusTone: "good", icon: "moon", tone: "sleep" },
      { label: "7-day moderate–vigorous activity", value: "1h 30m", status: "Fair", statusTone: "fair", icon: "flame", tone: "activity" },
      { label: "Vascular load", value: "Moderate", status: "Fair", statusTone: "fair", icon: "gauge", tone: "vitals" },
      { label: "BMI", value: "22.4", status: "Healthy", statusTone: "good", icon: "scale", tone: "nutrition" },
    ],
  },

  cardio: {
    status: "Balanced", position: 0.55, band: [0.4, 0.72],
    today: [2, 2, 3, 3, 4, 9, 18, 22, 24, 24],
    labels: ["12 AM", "6 AM", "12 PM", "6 PM"],
    note: "Your recent cardio load is in line with your usual training level, so training and recovery are well balanced. This range safely improves fitness while keeping injury risk low.",
    fitnessIndex: { value: 48, unit: "VO₂max", band: "Excellent", percentile: "Top 15% for your age", delta: 1 },
  },

  actionPlan: {
    focus: "This week's focus: rebuild sleep consistency",
    progress: 3, total: 5,
    tasks: [
      { id: 1, title: "Wind down by 10:30pm", tone: "sleep", icon: "moon", done: true, meta: "5-day streak" },
      { id: 2, title: "Add 20g of fiber at breakfast", tone: "nutrition", icon: "apple", done: true, meta: "Antioxidant Index +4" },
      { id: 3, title: "Zone 2 cardio, 30 min", tone: "activity", icon: "footprints", done: true, meta: "Cardio load balanced" },
      { id: 4, title: "10-minute breathwork", tone: "mind", icon: "brain", done: false, meta: "Lowers overnight HR" },
      { id: 5, title: "Log an afternoon BP reading", tone: "vitals", icon: "heart-pulse", done: false, meta: "Improves heart score" },
    ],
    recommendations: [
      { title: "Shift caffeine earlier", body: "Your last coffee averaged 3:40pm this week. Moving it before noon could add ~25 min of deep sleep.", tone: "sleep", icon: "coffee" },
      { title: "Raise potassium intake", body: "Vascular load is limiting your heart score. Aim for 3,500mg/day.", tone: "heart", icon: "heart" },
    ],
  },

  genetics: {
    summary: "Your DNA was analyzed across 340 traits and 1,200+ risk markers.",
    highlights: [
      { trait: "Cardiovascular disease", risk: "Slightly elevated", tone: "fair", detail: "1.3× average · 12 markers", icon: "heart" },
      { trait: "Type 2 diabetes", risk: "Average", tone: "good", detail: "0.9× average · 28 markers", icon: "droplet" },
      { trait: "Caffeine metabolism", risk: "Slow metabolizer", tone: "fair", detail: "CYP1A2 variant", icon: "coffee" },
      { trait: "Vitamin D", risk: "Prone to deficiency", tone: "attention", detail: "GC + VDR variants", icon: "sun" },
      { trait: "Lactose tolerance", risk: "Tolerant", tone: "good", detail: "MCM6 variant", icon: "milk" },
    ],
    ancestry: [
      { region: "Northern European", pct: 46, color: "var(--sleep-500)" },
      { region: "Southern European", pct: 28, color: "var(--teal-500)" },
      { region: "West African", pct: 18, color: "var(--nutrition-500)" },
      { region: "East Asian", pct: 8, color: "var(--mind-500)" },
    ],
    traits: 340, markers: 1240,
  },

  biomarkers: {
    lastDraw: "Drawn June 28 · Quest Diagnostics",
    panels: [
      { group: "Metabolic", items: [
        { label: "Fasting glucose", value: "88", unit: "mg/dL", status: "Optimal", statusTone: "excellent", range: "70–99" },
        { label: "HbA1c", value: "5.2", unit: "%", status: "Optimal", statusTone: "excellent", range: "<5.7" },
        { label: "AGEs Index", value: "1.8", unit: "AU", status: "Good", statusTone: "good", range: "<2.0" },
      ]},
      { group: "Lipids", items: [
        { label: "LDL cholesterol", value: "128", unit: "mg/dL", status: "Borderline", statusTone: "fair", range: "<100" },
        { label: "HDL cholesterol", value: "58", unit: "mg/dL", status: "Optimal", statusTone: "excellent", range: ">40" },
        { label: "Triglycerides", value: "92", unit: "mg/dL", status: "Good", statusTone: "good", range: "<150" },
      ]},
      { group: "Inflammation & nutrients", items: [
        { label: "hs-CRP", value: "0.6", unit: "mg/L", status: "Optimal", statusTone: "excellent", range: "<1.0" },
        { label: "Vitamin D", value: "24", unit: "ng/mL", status: "Low", statusTone: "attention", range: "30–50" },
        { label: "Ferritin", value: "68", unit: "ng/mL", status: "Good", statusTone: "good", range: "30–200" },
      ]},
    ],
    antioxidant: { value: 74, band: "Good", delta: 4, trend: [60, 62, 61, 66, 68, 70, 74] },
  },

  wearables: {
    devices: [
      { name: "Aperture Ring", detail: "Worn now · 84% battery", icon: "circle-dot", connected: true, tone: "teal" },
      { name: "Chest strap ECG", detail: "Synced 2h ago", icon: "heart-pulse", connected: true, tone: "heart" },
      { name: "Smart scale", detail: "Last reading yesterday", icon: "scale", connected: true, tone: "nutrition" },
      { name: "Continuous glucose monitor", detail: "Not connected", icon: "droplet", connected: false, tone: "activity" },
    ],
    liveHr: 72,
    hrSeries: [70, 71, 69, 72, 74, 73, 71, 70, 72, 75, 78, 74, 72],
    sleepStages: { deep: 92, rem: 108, light: 214, awake: 18 },
    steps: 9204,
  },
};
