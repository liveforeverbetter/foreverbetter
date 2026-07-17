Single circular progress ring; put a value + label in the center via children.

```jsx
<ProgressRing value={82} size={110} color="var(--score-good)">
  <span style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:28}}>82</span>
  <span style={{fontSize:12,color:"var(--text-tertiary)"}}>Sleep</span>
</ProgressRing>
```
