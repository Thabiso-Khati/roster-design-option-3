#!/usr/bin/env bash
# ============================================================
# ROSTER — Observability setup script
# ------------------------------------------------------------
# Installs and wires Sentry + PostHog into the project.
# Run once from the project root:
#
#   bash scripts/setup-observability.sh
#
# Prerequisites: node 20+, npm, an active .env.local
# ============================================================

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

step() { echo -e "\n${BOLD}${CYAN}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $1${RESET}"; }

# ── 1. Install packages ───────────────────────────────────────────────────────
step "Installing @sentry/nextjs and posthog-js"
npm install @sentry/nextjs posthog-js posthog-node
ok "Packages installed"

# ── 2. Verify Sentry DSN is present ──────────────────────────────────────────
step "Checking environment variables"

ENV_FILE=".env.local"
MISSING=()

check_var() {
  local var="$1"
  if ! grep -q "^${var}=" "$ENV_FILE" 2>/dev/null || grep -q "^${var}=$" "$ENV_FILE" 2>/dev/null; then
    MISSING+=("$var")
  fi
}

check_var "NEXT_PUBLIC_SENTRY_DSN"
check_var "SENTRY_ORG"
check_var "SENTRY_PROJECT"
check_var "SENTRY_AUTH_TOKEN"
check_var "NEXT_PUBLIC_POSTHOG_KEY"
check_var "NEXT_PUBLIC_POSTHOG_HOST"

if [ ${#MISSING[@]} -gt 0 ]; then
  warn "The following env vars are missing or empty in ${ENV_FILE}:"
  for v in "${MISSING[@]}"; do
    echo "    $v"
  done
  echo ""
  echo "  Sentry DSN    → https://sentry.io → your project → Settings → SDK Setup"
  echo "  Sentry token  → https://sentry.io → Settings → Auth Tokens → Create"
  echo "  PostHog key   → https://app.posthog.com → Project Settings → Project API key"
  echo "  PostHog host  → https://app.posthog.com (or your self-hosted URL)"
  echo ""
  warn "Setup complete but some keys are missing. Fill them in and restart the dev server."
else
  ok "All environment variables present"
fi

# ── 3. TypeScript check ───────────────────────────────────────────────────────
step "Running TypeScript check"
npx tsc --noEmit && ok "No TypeScript errors" || warn "TypeScript errors detected — check output above"

# ── 4. Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}✓ Observability setup complete${RESET}"
echo ""
echo "  Next steps:"
echo "  1. Fill in any missing env vars above in .env.local"
echo "  2. Restart the dev server: npm run dev"
echo "  3. Trigger a test error to verify Sentry: visit /api/test-sentry (dev only)"
echo "  4. Check https://sentry.io for the incoming event"
echo "  5. Check https://app.posthog.com for the first pageview"
echo ""
