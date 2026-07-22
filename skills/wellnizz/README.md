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
