#!/usr/bin/env bash
# Import n8n workflows via API
# Usage: N8N_API_KEY=xxx VERCEL_APP_URL=https://xxx.vercel.app ./scripts/n8n-import.sh

set -euo pipefail

N8N_BASE="${N8N_BASE:-https://dub1c.app.n8n.cloud}"
N8N_API_KEY="${N8N_API_KEY:?Set N8N_API_KEY from n8n Settings > API}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

import_workflow() {
  local file="$1"
  local name
  name=$(basename "$file" .json)
  echo "Importing $name..."
  curl -s -X POST "$N8N_BASE/api/v1/workflows" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$file" | python3 -m json.tool 2>/dev/null || echo "Import sent for $name"
}

for f in "$ROOT/n8n"/workflow-*.json; do
  [[ -f "$f" ]] && import_workflow "$f"
done

echo ""
echo "Next: In n8n UI set variable VERCEL_APP_URL=$VERCEL_APP_URL"
echo "Create HTTP Header Auth credential: Authorization = Bearer YOUR_N8N_WEBHOOK_SECRET"
