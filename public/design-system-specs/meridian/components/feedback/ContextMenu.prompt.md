Floating menu surface. Pass `items` (with `separator:true` dividers) or MenuItem children.

```jsx
<ContextMenu items={[
  {icon:<Icon name="pencil" size={16}/>,label:'Edit'},
  {separator:true},
  {icon:<Icon name="trash-2" size={16}/>,label:'Delete',danger:true},
]} />
```
