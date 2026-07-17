Transparent app top bar. Title on the left (optionally with a back chevron), action IconButtons on the right.

```jsx
<TopBar title="Heart health" onBack={goBack}
  actions={<><IconButton label="Trends"><i data-lucide="bar-chart-2" /></IconButton>
             <IconButton label="More"><i data-lucide="more-vertical" /></IconButton></>} />
```
Use `large` for home/overview screen headers.
