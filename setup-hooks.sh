#!/bin/bash

# Git Hooks Installation Script for EduSphere
# Installs pre-commit and commit-msg hooks
#
# Run with: ./setup-hooks.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  EduSphere Git Hooks Installation${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo "Run this script from the root of the repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-commit hook
echo -e "${YELLOW}Installing pre-commit hook...${NC}"
if [ -f ".github/hooks/pre-commit" ]; then
    cp ".github/hooks/pre-commit" ".git/hooks/pre-commit"
    chmod +x ".git/hooks/pre-commit"
    echo -e "${GREEN}✓ pre-commit hook installed${NC}"
else
    echo -e "${RED}✗ .github/hooks/pre-commit not found${NC}"
fi

# Install commit-msg hook
echo -e "${YELLOW}Installing commit-msg hook...${NC}"
if [ -f ".github/hooks/commit-msg" ]; then
    cp ".github/hooks/commit-msg" ".git/hooks/commit-msg"
    chmod +x ".git/hooks/commit-msg"
    echo -e "${GREEN}✓ commit-msg hook installed${NC}"
else
    echo -e "${RED}✗ .github/hooks/commit-msg not found${NC}"
fi

echo -e "\n${GREEN}✅ Git hooks installed successfully!${NC}\n"

echo -e "${YELLOW}What these hooks do:${NC}"
echo -e "${BLUE}  pre-commit${NC}"
echo "    • Prevents committing .env files"
echo "    • Blocks console.log statements"
echo "    • Catches hardcoded secrets"
echo "    • Enforces naming conventions"
echo "    • Runs ESLint on staged files"
echo ""
echo -e "${BLUE}  commit-msg${NC}"
echo "    • Enforces semantic commit messages"
echo "    • Valid types: feat, fix, docs, refactor, style, test, chore, perf, ci"
echo ""

echo -e "${YELLOW}Examples:${NC}"
echo "  ✓ feat: add resource filtering"
echo "  ✓ fix(api): resolve JWT validation error"
echo "  ✓ docs: update API documentation"
echo "  ✓ test: add upload service tests"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Make your changes"
echo "  2. Stage files: git add ."
echo "  3. Commit: git commit -m 'feat: description'"
echo "  4. Hooks will validate automatically"
echo ""

echo -e "${YELLOW}Bypass hooks (if needed):${NC}"
echo "  Use --no-verify flag: git commit --no-verify"
echo "  (Use sparingly - hooks exist to maintain quality!)"
echo ""

exit 0
