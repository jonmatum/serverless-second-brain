#!/usr/bin/env bash
# Migrate existing nodes to add visibility field.
# Sets all existing nodes without visibility to "public" (preserves current behavior).
# Usage: ./scripts/migrate-visibility.sh [--execute]

set -euo pipefail

REGION="us-east-1"
TABLE="ssb-dev-knowledge-graph"
DRY_RUN=true
VISIBILITY="public"

[[ "${1:-}" == "--execute" ]] && DRY_RUN=false

echo "============================================"
echo " Visibility Migration — $TABLE"
echo " Setting: visibility=$VISIBILITY"
echo " Mode: $([ "$DRY_RUN" = true ] && echo 'DRY RUN' || echo 'EXECUTE')"
echo "============================================"
echo ""

# Find nodes without visibility field
NODES=$(aws dynamodb scan \
  --table-name "$TABLE" \
  --region "$REGION" \
  --filter-expression "SK = :meta AND attribute_not_exists(visibility)" \
  --expression-attribute-values '{":meta":{"S":"META"}}' \
  --projection-expression "PK,SK,slug" \
  --no-cli-pager --output json --query 'Items' 2>&1)

COUNT=$(echo "$NODES" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "Found $COUNT nodes without visibility field"

if [ "$COUNT" = "0" ]; then
  echo "Nothing to migrate."
  exit 0
fi

if [ "$DRY_RUN" = true ]; then
  echo "$NODES" | python3 -c "
import json, sys
for n in json.load(sys.stdin)[:10]:
    print(f\"  {n['slug']['S']}\")
" 2>/dev/null
  [ "$COUNT" -gt 10 ] && echo "  ... and $((COUNT - 10)) more"
  echo ""
  echo "Dry run — use --execute to apply."
  exit 0
fi

echo "Updating..."
echo "$NODES" | python3 -c "
import json, sys, subprocess
nodes = json.load(sys.stdin)
for n in nodes:
    pk = n['PK']['S']
    subprocess.run([
        'aws', 'dynamodb', 'update-item',
        '--table-name', '$TABLE', '--region', '$REGION',
        '--key', json.dumps({'PK': {'S': pk}, 'SK': {'S': 'META'}}),
        '--update-expression', 'SET visibility = :v',
        '--expression-attribute-values', json.dumps({':v': {'S': '$VISIBILITY'}}),
        '--no-cli-pager'
    ], capture_output=True)
    slug = n['slug']['S']
    print(f'  ✅ {slug}')
"

echo ""
echo "Done. $COUNT nodes updated."
