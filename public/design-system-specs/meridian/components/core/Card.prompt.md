The base surface for dashboard content. Compose everything on Cards.

```jsx
<Card glow="recovery">
  <CardHeader label="Recovery" action={<Chevron/>} />
  …content…
</Card>
<Card interactive onClick={open}>Tap target</Card>
```
`padding` none/sm/md/lg · `raised` · `interactive` (hover lift) · `glow` recovery/strain/sleep/brand.
