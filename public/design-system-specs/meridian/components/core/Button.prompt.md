One mint-fill primary action per view; secondary/ghost/subtle recede, danger destroys.

```jsx
<Button variant="primary" size="md" onClick={save}>Start activity</Button>
<Button variant="secondary" iconLeft={<PlusIcon/>}>Add activity</Button>
<Button variant="ghost" size="sm">Skip</Button>
<Button variant="danger">Delete</Button>
```
Variants: primary · secondary · ghost · subtle · danger. Sizes sm/md/lg. `pill`, `block`, `loading`, `disabled`, `iconLeft`/`iconRight`.
