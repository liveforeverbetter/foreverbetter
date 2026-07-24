#!/usr/bin/env bash
# PostToolUse hook: keep API docs in sync with the code.
#
# - When the API reference schema (src/schemas.ts or src/endpoints.ts) changes,
#   regenerate docs/openapi.json automatically, then prompt a prose-docs update.
# - When any other API-defining file changes, prompt the sync steps.
# - Stays silent for every other file.
set -uo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0
repo="${file%%/src/*}"

emit() { jq -n --arg m "$1" '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $m}}'; }

case "$file" in
  */src/schemas.ts|*/src/endpoints.ts)
    # The reference is generated from code — regenerate it automatically.
    if [ -n "$repo" ] && ( cd "$repo" && npm run openapi:generate >/dev/null 2>&1 ); then
      emit "API reference schema changed ($file). Regenerated docs/openapi.json automatically. Before finishing, update the relevant docs/*.mdx pages using the Diataxis framework (full request/response examples and a use-case guide for the affected flow), reflect any new response fields there, and update the onboarding/install skill skills/wellnizz/SKILL.md if the flow or endpoints an agent uses changed."
    else
      emit "API reference schema changed ($file), but automatic openapi:generate did not run cleanly. Run \`npm run openapi:generate\`, update the relevant docs/*.mdx (Diataxis), and update skills/wellnizz/SKILL.md if agent-facing flows changed."
    fi
    ;;
  */src/http.ts|*/src/auth.ts|*/src/core/genetic-insights.ts|*/src/core/health-context.ts|*/src/core/analysis.ts)
    emit "API surface changed ($file). Before finishing, run \`npm run openapi:generate\`, update the relevant docs/*.mdx pages using the Diataxis framework (full request/response examples and a use-case guide for the affected flow), and update the onboarding/install skill skills/wellnizz/SKILL.md if the flow or endpoints an agent uses changed."
    ;;
  *)
    : # not an API-defining file — stay silent
    ;;
esac
