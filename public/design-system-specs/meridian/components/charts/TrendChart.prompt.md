The system's time-series visual: smooth line with a fading area fill, colored per channel.

```jsx
<TrendChart channel="recovery" data={[62,58,71,65,60,74,66]} band={[60,80]}
  labels={['Sat','Sun','Mon','Tue','Wed','Thu','Fri']} />
```
`band` shades an optimal window; `showDots`/`showLast` toggle point markers.
