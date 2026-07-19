#!/bin/sh
# One image serves the API and both workers. PROCESS selects which to run so
# docker-compose (and any orchestrator) can point every service at this image.
set -e

# If an explicit command is passed (e.g. Fly's [processes] commands), run it.
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

case "${PROCESS:-api}" in
  api)
    exec node dist/index.js
    ;;
  worker:wgs|genetics-worker|wgs)
    exec node dist/workers/genetics-worker.js
    ;;
  worker:wearables|wearables-worker|wearables)
    exec node dist/workers/wearables-worker.js
    ;;
  worker:prs-reference|prs-reference)
    exec node dist/workers/prs-reference-worker.js
    ;;
  migrate)
    exec node dist/db/migrate.js
    ;;
  *)
    echo "Unknown PROCESS '${PROCESS}'. Use api, worker:wgs, worker:wearables, worker:prs-reference, or migrate." >&2
    exit 1
    ;;
esac
