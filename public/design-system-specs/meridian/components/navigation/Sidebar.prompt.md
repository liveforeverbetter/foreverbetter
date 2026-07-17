Desktop sidebar. Items with `{value,label,icon,badge}`; `{section:'…'}` renders a group label. `collapsed` shrinks to a mini rail.

```jsx
<Sidebar value={view} onChange={setView} footer={<UserChip/>}
  items={[{value:'home',label:'Overview',icon:<Icon name="layout-dashboard"/>},{section:'Body'},{value:'sleep',label:'Sleep',icon:<Icon name="moon"/>}]} />
```
