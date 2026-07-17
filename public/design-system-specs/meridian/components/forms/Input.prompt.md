Dark inset text field. Pass `label`, `hint`, `error`, `iconLeft`.

```jsx
<Input label="Email" placeholder="you@domain.com" iconLeft={<Icon name="mail" size={16}/>} />
<Input label="Weight" value={w} onChange={e=>setW(e.target.value)} error="Required" />
```
Sizes sm/md/lg. Focus shows a mint ring; error turns border red.
