#!/bin/bash
# SHIP_STATIC_SITE - Deploy any static site to GitHub Pages

set -e

PROJECT_NAME="${1:-}"
GITHUB_USERNAME="${GITHUB_USERNAME:-}"

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: ship_static_site <project-name>"
  echo "Example: ship_static_site team-portal"
  exit 1
fi

PROJECT_PATH="/Users/goobbotv3/.openclaw/workspace-cody/$PROJECT_NAME"
INDEX_FILE="$PROJECT_PATH/index.html"

# Check if project exists
if [ ! -d "$PROJECT_PATH" ]; then
  echo "Error: Project folder not found at $PROJECT_PATH"
  exit 1
fi

# Check for index.html
if [ ! -f "$INDEX_FILE" ]; then
  echo "Error: index.html not found in $PROJECT_PATH"
  exit 1
fi

cd "$PROJECT_PATH"

# Check git auth
echo "🔐 Checking GitHub authentication..."
if ! gh auth status &>/dev/null; then
  echo "Not logged in. Run: gh auth login"
  exit 1
fi

GITHUB_USERNAME=$(gh api user --jq '.login')
REPO_NAME="$PROJECT_NAME"

echo "📦 Initializing repo..."
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "Initial commit"
fi

echo "🚀 Creating GitHub repo..."
gh repo create "$REPO_NAME" --private --source=. --push --quiet 2>/dev/null || {
  echo "Repo may already exist, pushing..."
  git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null
}

REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME"
PAGES_URL="https://$GITHUB_USERNAME.github.io/$REPO_NAME"

echo ""
echo "========================================"
echo "PROJECT NAME: $PROJECT_NAME"
echo "LOCAL PATH: $PROJECT_PATH/"
echo "GITHUB REPO URL: $REPO_URL"
echo "PAGES LIVE URL: $PAGES_URL"
echo "========================================"
echo ""
echo "⚠️  To enable GitHub Pages:"
echo "   1. Go to: $REPO_URL/settings/pages"
echo "   2. Source: Deploy from a branch"
echo "   3. Branch: main"
echo "   4. Folder: /(root)"
echo "   5. Click Save, wait 1-2 min"
