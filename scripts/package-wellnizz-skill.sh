#!/usr/bin/env bash
# Package the hosted agent skill (public/SKILL.md) as a self-contained folder
# ready to publish to a skills repository or drop into ~/.claude/skills.
#
# public/SKILL.md is the single source of truth (it is also what the API serves
# at /SKILL.md). This script copies it verbatim into skills/wellnizz/ so the
# distributable never drifts from the hosted version. The skill has no local
# asset dependencies: every reference is a live URL or an API call.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$root/public/SKILL.md"
dest="$root/skills/wellnizz"

if [[ ! -f "$src" ]]; then
  echo "Source skill not found: $src" >&2
  exit 1
fi

name="$(sed -n 's/^name:[[:space:]]*//p' "$src" | head -1)"
if [[ "$name" != "wellnizz" ]]; then
  echo "Expected public/SKILL.md frontmatter name 'wellnizz', found '$name'." >&2
  exit 1
fi

mkdir -p "$dest"
cp "$src" "$dest/SKILL.md"

cat > "$dest/README.md" <<'EOF'
# wellnizz

Turn genetic, biomarker, wearable, and behavioral data into one interpretable
healthspan dashboard, an evidence-graded action plan, an ancestry breakdown,
longitudinal trends, and an agent-ready health context.

This is a self-contained agent skill: a single `SKILL.md` with no local
dependencies. Every reference is a live URL or an API call against the Wellnizz
API, so it behaves identically installed from the hosted URL or from this folder.

## Install

Hosted URL (always current):

```
# Claude Code / Claude App
/skill https://app.wellnizz.com/SKILL.md

# Codex / OpenAI
codex skill add wellnizz https://app.wellnizz.com/SKILL.md

# Hermes
hermes skill install https://app.wellnizz.com/SKILL.md

# Openclaw
openclaw skill add wellnizz https://app.wellnizz.com/SKILL.md
```

Local folder (offline / air-gapped / vendored):

```
cp -R wellnizz ~/.claude/skills/wellnizz    # or ~/.codex/skills/wellnizz
```

The folder name is the skill name; `SKILL.md` is the only required file.

## Source

Regenerated from `public/SKILL.md` in the Wellnizz API repo via
`npm run skill:package`. Edit the skill there, not here.
EOF

echo "Packaged wellnizz skill into $dest"
ls -la "$dest"
