The conversational AI insight card — one per screen, at the top. Second-person, plain-language, optionally with carousel dots.

```jsx
<InsightBanner gradient="var(--grad-mesh)" glow title="Incredible yesterday!"
  body="You walked 2.5× farther than the day before. Walking is one of the best ways to stay healthy — keep this trend going."
  dots={3} activeDot={0} />
```
For domain-specific insights pass `tone` + `icon` instead of a gradient.
