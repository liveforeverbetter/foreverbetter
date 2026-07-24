#!/usr/bin/env bash
# PostToolUse hook: when an API-defining source file is edited, remind Claude to
# keep the downstream artifacts (OpenAPI spec, Mintlify docs, agent skill bundle)
# in sync before finishing. Stays silent for any other file.
set -euo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file" in
  */src/http.ts|*/src/endpoints.ts|*/src/schemas.ts|*/src/auth.ts|*/src/core/genetic-insights.ts|*/src/core/health-context.ts|*/src/core/analysis.ts)
    jq -n --arg f "$file" '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: ("API surface changed (" + $f + "). Before finishing this task, keep the downstream artifacts in sync: (1) run `npm run openapi:generate` to regenerate the OpenAPI spec; (2) update the relevant docs/*.mdx pages using the Diataxis framework — include full request/response examples and use-case guides for the affected flow; (3) re-bundle the agent skill with `npm run skill:bundle`.")
      }
    }'
    ;;
  *)
    : # not an API-defining file — stay silent
    ;;
esac
