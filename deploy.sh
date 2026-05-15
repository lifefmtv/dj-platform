#!/usr/bin/env bash
set -e

MSG="${1:-deploy}"

echo "▶ Staging source changes..."
# Stage modified tracked files and new source files — never node_modules or .next
git add --update
git add app/ components/ context/ lib/ public/ styles/ \
        deploy.sh .gitignore 2>/dev/null || true

echo "▶ Committing: $MSG"
git commit -m "$MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" 2>/dev/null || echo "  (nothing to commit)"

echo "▶ Pushing to origin/main..."
git push

echo "✓ Done — $MSG"
