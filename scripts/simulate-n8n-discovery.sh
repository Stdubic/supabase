#!/usr/bin/env bash
# Multi-source job discovery → ingest (mirrors n8n daily workflow)
# Usage: N8N_WEBHOOK_SECRET=xxx ./scripts/simulate-n8n-discovery.sh [VERCEL_URL]

set -euo pipefail

BASE_URL="${1:-https://job-agent-eosin.vercel.app}"
SECRET="${N8N_WEBHOOK_SECRET:?Set N8N_WEBHOOK_SECRET}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Multi-source discovery ==="
python3 "$SCRIPT_DIR/discover-jobs.py" --test-sources

echo ""
echo "=== Ingesting to $BASE_URL ==="
python3 "$SCRIPT_DIR/discover-jobs.py" --ingest "$BASE_URL" "$SECRET"

echo ""
echo "Review: $BASE_URL/inbox"
