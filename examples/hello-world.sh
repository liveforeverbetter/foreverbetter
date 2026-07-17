#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8787}"
TOKEN="${HEALTH_API_TOKEN:-dev-token}"
USER_ID="${HEALTH_API_USER_ID:-sandbox-user}"
ORG_ID="${HEALTH_API_ORG_ID:-sandbox-org}"

auth_header=(-H "authorization: Bearer ${TOKEN}")
json_header=(-H "content-type: application/json")

echo "Checking readiness..."
curl -fsS "${API_BASE_URL}/ready" | node -e 'let x="";process.stdin.on("data",d=>x+=d).on("end",()=>{const r=JSON.parse(x); console.log(JSON.stringify({ok:r.ok, auth_mode:r.auth_mode, storage:r.storage?.checks}, null, 2)); if(!r.ok) process.exit(1);})'

import_body=$(cat <<JSON
{
  "user_id": "${USER_ID}",
  "organization_id": "${ORG_ID}",
  "category": "biomarkers",
  "filename": "labs.csv",
  "content_type": "text/csv",
  "text": "marker,value,unit\\nApoB,118,mg/dL\\nHbA1c,5.7,%\\nFasting Insulin,12,uIU/mL\\nGlucose,96,mg/dL\\n"
}
JSON
)

echo "Uploading biomarker CSV..."
import_response=$(curl -fsS -X POST "${API_BASE_URL}/imports/file" \
  "${auth_header[@]}" "${json_header[@]}" \
  -H "idempotency-key: hello-world-import" \
  --data "${import_body}")
source_id=$(printf '%s' "${import_response}" | node -e 'let x="";process.stdin.on("data",d=>x+=d).on("end",()=>console.log(JSON.parse(x).source.id))')
echo "source_id=${source_id}"

analysis_body=$(cat <<JSON
{
  "user_id": "${USER_ID}",
  "organization_id": "${ORG_ID}",
  "source_ids": ["${source_id}"],
  "profile": { "age": 42, "sex": "male" }
}
JSON
)

echo "Running analysis..."
analysis_response=$(curl -fsS -X POST "${API_BASE_URL}/analyses" \
  "${auth_header[@]}" "${json_header[@]}" \
  -H "idempotency-key: hello-world-analysis" \
  --data "${analysis_body}")
analysis_id=$(printf '%s' "${analysis_response}" | node -e 'let x="";process.stdin.on("data",d=>x+=d).on("end",()=>console.log(JSON.parse(x).id))')
echo "analysis_id=${analysis_id}"

echo "Querying health context..."
curl -fsS -X POST "${API_BASE_URL}/query" \
  "${auth_header[@]}" "${json_header[@]}" \
  --data "{\"user_id\":\"${USER_ID}\",\"organization_id\":\"${ORG_ID}\",\"analysis_ids\":[\"${analysis_id}\"],\"query\":\"ApoB\"}" \
  | node -e 'let x="";process.stdin.on("data",d=>x+=d).on("end",()=>{const r=JSON.parse(x); console.log(JSON.stringify({answer:r.answer, matches:r.matches?.length ?? 0}, null, 2));})'

echo "Listing MCP tools..."
curl -fsS -X POST "${API_BASE_URL}/mcp" \
  "${auth_header[@]}" "${json_header[@]}" \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | node -e 'let x="";process.stdin.on("data",d=>x+=d).on("end",()=>{const r=JSON.parse(x); console.log(r.result.tools.map(t=>t.name).join("\n"));})'
