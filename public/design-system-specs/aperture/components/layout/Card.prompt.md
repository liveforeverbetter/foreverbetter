The core surface. Every tile, sheet, and panel is a `Card`. Default `tone="none"` is a white surface with a hairline border and soft shadow; domain tones (`teal`, `sleep`, `activity`, `nutrition`, `mind`, `vitals`, `heart`) and score tones (`excellent`, `good`, `fair`, `attention`) apply pastel washes for insight/status cards.

```jsx
<Card radius="xl" padding="lg">…metric content…</Card>
<Card tone="good" radius="xl">Your heart health score is good…</Card>
<Card gradient="var(--grad-mesh)" radius="2xl" glow>Featured insight</Card>
```

Use `glow` sparingly — only on the single featured insight per screen. `interactive` adds a hover lift for tappable cards.
