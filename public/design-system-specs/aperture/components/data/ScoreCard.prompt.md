The hero score pattern (Heart Health Score, Energy Score). Big numeral + band + delta + plain-language explanation.

```jsx
<ScoreCard score={77} band="Good" tone="good" delta={2}
  description="Your heart health score is good. Vascular load is a critical part of your score — a diet high in potassium can help keep it under control." />
```
`tone` sets both the wash and the band color: `excellent` (teal), `good` (green), `fair` (amber), `attention` (coral). Descriptions are second-person, calm, and actionable.
