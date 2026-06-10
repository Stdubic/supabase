#!/usr/bin/env bash
# Test job ingest endpoint
# Usage: ./scripts/test-ingest.sh [BASE_URL] [SECRET]

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
SECRET="${2:-${N8N_WEBHOOK_SECRET:-test-secret}}"

echo "Testing ingest at $BASE_URL/api/jobs/ingest"

curl -s -X POST "$BASE_URL/api/jobs/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '[{
    "title": "Senior Backend Engineer PHP Laravel",
    "company": "Test Company",
    "url": "https://example.com/jobs/test-'$(date +%s)'",
    "description": "Remote Europe. PHP Laravel Symfony backend. MySQL Redis AWS.",
    "source": "test",
    "location": "Remote Europe"
  }]' | python3 -m json.tool

echo ""
echo "Check inbox: $BASE_URL/inbox"
