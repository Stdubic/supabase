#!/usr/bin/env bash
# Generate secrets and print Vercel env setup commands
set -euo pipefail

gen_secret() {
  openssl rand -hex 24
}

WEBHOOK_SECRET=$(gen_secret)
CALLBACK_SECRET=$(gen_secret)
DASHBOARD_PW=$(gen_secret | cut -c1-16)

echo "=== Generated secrets (save these) ==="
echo "N8N_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo "VERCEL_CALLBACK_SECRET=$CALLBACK_SECRET"
echo "DASHBOARD_PASSWORD=$DASHBOARD_PW"
echo ""
echo "=== Vercel env commands ==="
echo "cd job-agent"
echo "echo '$WEBHOOK_SECRET' | vercel env add N8N_WEBHOOK_SECRET production"
echo "echo '$CALLBACK_SECRET' | vercel env add VERCEL_CALLBACK_SECRET production"
echo "echo '$DASHBOARD_PW' | vercel env add DASHBOARD_PASSWORD production"
echo "# Add manually: SUPABASE_URL, SUPABASE_SERVICE_KEY, GITHUB_TOKEN, GITHUB_REPO"
