Desktop dashboard navigation rail. Brand lockup on top, grouped links below, footer slot at the bottom.

```jsx
<Sidebar brand="Aperture" active="overview" onSelect={setView} items={[
  { id:"overview", label:"Overview", icon:<i data-lucide="layout-grid" /> },
  { label:"Health", section:true },
  { id:"genetics", label:"Genetics", icon:<i data-lucide="dna" /> },
  { id:"biomarkers", label:"Biomarkers", icon:<i data-lucide="flask-conical" />, badge:3 },
]} />
```
Items with `section:true` render as uppercase group headings.
