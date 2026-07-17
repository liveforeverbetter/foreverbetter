Compact metric tile — the grid workhorse for biomarker/vitals panels.

```jsx
<MetricTile label="7-day sleep time average" value="6h 41m" status="Good" statusTone="good"
  icon={<i data-lucide="moon" />} iconTone="sleep" />
<MetricTile label="Heart rate" value="85" unit="bpm" status="High" statusTone="attention" />
```
Pair `statusTone` with the reading (good/fair/attention). Use in 2- or 3-up grids.
