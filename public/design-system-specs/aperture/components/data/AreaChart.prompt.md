Compact area chart with gradient fill and an optional shaded target band.

```jsx
<AreaChart data={[2,3,3,8,14,22,24,24]} color="var(--activity-500)"
  targetBand={[20,30]} xLabels={["12 AM","6 AM","12 PM","6 PM"]} height={150} />
```
Pass a domain color var. `targetBand` values are in data units.
