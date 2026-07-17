Floating pill bottom-nav for the mobile app (Home / Together / Fitness style).

```jsx
<TabBar active="home" onSelect={setTab} items={[
  { id:"home", label:"Home", icon:<i data-lucide="house" /> },
  { id:"plan", label:"Plan", icon:<i data-lucide="target" /> },
  { id:"labs", label:"Labs", icon:<i data-lucide="flask-conical" /> },
]} />
```
Keep to 3–5 items. Active item takes the brand teal.
