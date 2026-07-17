Interactive button with 6 variants; use `primary` (ink) for the main action on a screen, `brand` (teal) for on-brand affirmative actions, `soft` for low-emphasis brand actions, `ghost` in dense toolbars.

```jsx
<Button variant="primary" size="lg" fullWidth>Log a meal</Button>
<Button variant="soft" icon={<i data-lucide="plus" />}>Add metric</Button>
<Button variant="secondary">See details</Button>
```

Variants: `primary · brand · secondary · soft · ghost · danger`. Sizes `sm · md · lg`. Labels are sentence case, verbs first, never a trailing "→" or "!".
