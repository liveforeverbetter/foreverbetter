# health-api-service

## Documentation layout

- `docs/` is the source for the public Mintlify docs site. Every `.md`/`.mdx`
  file in it is published and reachable by URL, whether or not it appears in
  `docs.json` navigation. Only put content in `docs/` that customers may read.
- `docs-internal/` holds internal material: runbooks, plans, reports, vetting
  and gap analyses, infra setup. Anything referencing deploys, secrets, env
  vars, internal tooling, pricing strategy, or repo internals belongs there,
  never in `docs/`.
- Public pages must not mention internal operations: Fly app names or `fly`
  commands, managed database configuration, `npm run` scripts, `src/` paths, server
  env var names, or staging identifiers.

## Docs writing style

These rules exist because AI-generated drafts repeatedly introduced the same
tells, and they had to be stripped from the whole site once already. Apply
them to every page in `docs/`, including frontmatter descriptions, table
cells, and code comments:

- No em dash punctuation. Use a period, comma, colon, semicolon, or parentheses
  instead. En-dashes are fine in numeric ranges only (`2–4 g/day`, `A–D`).
- No rhetorical contrasts: "it's not X, it's Y", "X, not Y", "more than just
  X", "isn't just X". State what the thing is directly.
- No arrow chains in prose (`upload → analyze → list`). Write the steps out
  in words. A `# → { ... }` comment showing a response inside a code block
  is fine.
- No marketing filler: seamless, effortless, robust, leverage, delve, unlock,
  supercharge, elevate, game-changing.
- Match the voice of the existing pages: plain declarative sentences,
  concrete, imperative, curl-first, one idea per sentence.

Before committing docs changes, check for regressions:

```bash
rg -n '\x{2014}' docs/
grep -rniE "isn't just|not just|more than just|seamless|effortless|leverage|delve|robust|unlock" docs/
```

Both greps should return nothing.
