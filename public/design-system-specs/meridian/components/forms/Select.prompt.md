Native-backed select with styled chrome.

```jsx
<Select label="Goal" placeholder="Choose…" value={g} onChange={e=>setG(e.target.value)}
  options={[{value:'sleep',label:'Sleep more'},{value:'strain',label:'Train harder'}]} />
```
`options` accepts strings or {value,label}.
