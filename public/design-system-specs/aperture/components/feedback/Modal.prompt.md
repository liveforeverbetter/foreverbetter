Centered modal (desktop) or bottom sheet (mobile). Render only when open; it draws its own scrim.

```jsx
{open && (
  <Modal title="Log a reading" subtitle="Step 1: Choose a metric" onClose={close}
    actions={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary">Save</Button></>}>
    …form…
  </Modal>
)}
```
Pass `sheet` for the mobile bottom-sheet variant (rounded top corners + grab handle).
