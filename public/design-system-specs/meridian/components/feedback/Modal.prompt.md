Centered dialog on a blurred scrim. Control `open`; footer holds actions.

```jsx
<Modal open={open} title="Set smart alarm" subtitle="We'll wake you in your lightest sleep." onClose={close}
  footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={save}>Set alarm</Button></>}>
  …content…
</Modal>
```
