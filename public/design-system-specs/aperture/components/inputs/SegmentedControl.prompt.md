Segmented pill control. Text for time ranges; `iconOnly` for the app's domain-tab row.

```jsx
<SegmentedControl value={range} onChange={setRange} options={[
  {id:"day",label:"Day"},{id:"week",label:"Week"},{id:"month",label:"Month"}]} />

<SegmentedControl iconOnly value={tab} onChange={setTab} options={[
  {id:"overview",label:"Overview",icon:<i data-lucide="layout-grid" />},
  {id:"activity",label:"Activity",icon:<i data-lucide="activity" />}]} />
```
