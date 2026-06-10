#!/usr/bin/env bash
# Simulates n8n job discovery workflow: fetch Remotive → filter → ingest
# Usage: N8N_WEBHOOK_SECRET=xxx ./scripts/simulate-n8n-discovery.sh [VERCEL_URL]

set -euo pipefail

BASE_URL="${1:-https://job-agent-eosin.vercel.app}"
SECRET="${N8N_WEBHOOK_SECRET:?Set N8N_WEBHOOK_SECRET}"

TMP=$(mktemp)
trap 'rm -f "$TMP" "$TMP.out"' EXIT

echo "Fetching Remotive jobs..."
curl -s "https://remotive.com/api/remote-jobs?category=software-dev" -o "$TMP"

python3 - "$TMP" > "$TMP.out" << 'PYEOF'
import json, sys

with open(sys.argv[1]) as f:
    data = json.load(f)

jobs = data.get("jobs", [])
keywords = ["php", "laravel", "symfony", "backend", "software"]
exclude = ["wordpress only", "ios developer", "android developer"]
out = []

for job in jobs:
    text = f"{job.get('title','')} {job.get('description','')}".lower()
    if not any(k in text for k in keywords):
        continue
    if any(e in text for e in exclude):
        continue
    out.append({
        "title": job["title"],
        "company": job["company_name"],
        "url": job["url"],
        "description": (job.get("description") or "")[:2000],
        "source": "remotive",
        "location": job.get("candidate_required_location") or "Remote",
        "salary": job.get("salary"),
    })
    if len(out) >= 5:
        break

print(json.dumps(out))
PYEOF

COUNT=$(python3 -c "import json; print(len(json.load(open('$TMP.out'))))")
echo "Sending $COUNT jobs to $BASE_URL/api/jobs/ingest"

curl -s -X POST "$BASE_URL/api/jobs/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d @"$TMP.out" | python3 -m json.tool

echo ""
echo "Review: $BASE_URL/inbox"
