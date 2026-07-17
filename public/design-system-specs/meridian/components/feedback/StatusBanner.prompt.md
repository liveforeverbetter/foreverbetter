Full-width dashboard insight/alert strip.

```jsx
<StatusBanner tone="warning" title="Lower HRV Today" icon={<Icon name="activity"/>}
  action={<Button size="sm" variant="secondary">See recovery</Button>}>
  Your HRV is 7% lower than usual, landing you a yellow Recovery.
</StatusBanner>
```
Tones: info/success/warning/danger/neutral.
