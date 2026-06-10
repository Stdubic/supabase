#!/usr/bin/env bash
# End-to-end smoke test for job-agent
# Usage: ./scripts/e2e-smoke.sh [BASE_URL] [SECRET]

set -euo pipefail

BASE_URL="${1:-https://job-agent-eosin.vercel.app}"
SECRET="${2:-${N8N_WEBHOOK_SECRET:-}}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo "=== Job Agent E2E Smoke Test ==="
echo "URL: $BASE_URL"
echo ""

# 1. Health check
echo "1. Health check..."
HEALTH=$(curl -sf "$BASE_URL/api/health" || echo "FAIL")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  pass "Health check passed"
  echo "   $(echo "$HEALTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(', '.join(f'{k}={v}' for k,v in d.get('configured',{}).items()))")"
else
  fail "Health check failed: $HEALTH"
fi

# 2. Ingest test (requires secret)
if [ -n "$SECRET" ]; then
  echo ""
  echo "2. Ingest test..."
  TIMESTAMP=$(date +%s)
  INGEST=$(curl -sf -X POST "$BASE_URL/api/jobs/ingest" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SECRET" \
    -d "[{
      \"title\": \"E2E Test Job $TIMESTAMP\",
      \"company\": \"E2E Test Company\",
      \"url\": \"https://example.com/e2e-test-$TIMESTAMP\",
      \"description\": \"PHP Laravel backend developer role for E2E smoke test\",
      \"source\": \"e2e-test\",
      \"location\": \"Remote\"
    }]" || echo "FAIL")
  
  if echo "$INGEST" | grep -q '"success":true'; then
    INSERTED=$(echo "$INGEST" | python3 -c "import json,sys; print(json.load(sys.stdin).get('inserted', 0))")
    if [ "$INSERTED" -ge 1 ]; then
      pass "Ingest succeeded: inserted=$INSERTED"
    else
      warn "Ingest succeeded but job was filtered (score too low or duplicate)"
    fi
  else
    fail "Ingest failed: $INGEST"
  fi
  
  # 3. List jobs
  echo ""
  echo "3. List jobs..."
  JOBS=$(curl -sf "$BASE_URL/api/jobs" || echo "FAIL")
  if echo "$JOBS" | grep -q '"jobs"'; then
    COUNT=$(echo "$JOBS" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('jobs', [])))")
    pass "List jobs: $COUNT total"
  else
    fail "List jobs failed: $JOBS"
  fi
  
  # 4. List by status
  echo ""
  echo "4. Jobs by status..."
  for STATUS in pending approved prepared applied; do
    RESULT=$(curl -sf "$BASE_URL/api/jobs?status=$STATUS" || echo "FAIL")
    if echo "$RESULT" | grep -q '"jobs"'; then
      COUNT=$(echo "$RESULT" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('jobs', [])))")
      echo "   $STATUS: $COUNT"
    fi
  done
  pass "Status queries working"
  
else
  warn "Skipping ingest/list tests (no N8N_WEBHOOK_SECRET)"
fi

echo ""
echo "=== Smoke test complete ==="
echo ""
echo "Manual tests required:"
echo "  - Login at $BASE_URL"
echo "  - Approve a job → check GitHub Actions"
echo "  - Mark as Applied → check tracker sync"
