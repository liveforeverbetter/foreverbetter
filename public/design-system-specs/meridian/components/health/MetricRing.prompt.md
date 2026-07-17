The signature gauge. Channel sets the color; `display`/`unit` control the readout.

```jsx
<MetricRing channel="sleep" value={88} unit="%" label="Sleep" />
<MetricRing channel="strain" value={5.1} max={21} display="5.1" label="Strain" />
```
Channels: recovery · strain · sleep · stress · brand. `sweep={360}` for a full ring; pass `children` to fully customize the center.
