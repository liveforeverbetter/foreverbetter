# OMS Design System — project conventions

## Design System tab: component card ordering
Cards in the **6 · Components** group must stay in **alphabetical order by card name**.
Ordering is driven by the preview filename (lexical). Component preview cards use a
`c<N>_<slug>.html` naming scheme in `preview/` where `<N>` increments in alphabetical
order of the card's `@dsCard name`. When adding a NEW component, renumber the
`c<N>_` prefixes so the full set stays alphabetical (e.g. inserting "Drawer" between
"Customer profile" and "Global Banner" shifts the later ones up by one).

Each component preview's first line is its `@dsCard` tag:
`<!-- @dsCard group="6 · Components" name="<Name>" subtitle="…" viewport="WxH" -->`

Current order: Area chart tooltip · Badges · Buttons · Customer profile · Global Banner · Status banner.
