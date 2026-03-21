#!/usr/bin/env bash
# DynamoDB scale benchmark — measures query latency at current graph size.
# Usage: ./scripts/benchmark-dynamodb.sh [API_URL]

set -euo pipefail

API_URL="${1:-https://3wzbyt9i47.execute-api.us-east-1.amazonaws.com/dev}"
REGION="us-east-1"
TABLE="ssb-dev-knowledge-graph"
N=10

echo "============================================"
echo " DynamoDB Benchmark — $TABLE"
echo " Iterations: $N"
echo "============================================"
echo ""

# Count
NODE_COUNT=$(aws dynamodb scan --table-name "$TABLE" --region "$REGION" --no-cli-pager \
  --select COUNT --filter-expression "SK = :meta" \
  --expression-attribute-values '{":meta":{"S":"META"}}' \
  --query 'Count' --output text 2>/dev/null)
EDGE_COUNT=$(aws dynamodb scan --table-name "$TABLE" --region "$REGION" --no-cli-pager \
  --select COUNT --filter-expression "begins_with(SK, :edge)" \
  --expression-attribute-values '{":edge":{"S":"EDGE#"}}' \
  --query 'Count' --output text 2>/dev/null)
echo "Graph: $NODE_COUNT nodes, $EDGE_COUNT edges"
echo ""

SLUG=$(curl -s "$API_URL/graph" | python3 -c "import json,sys; print(json.load(sys.stdin)['nodes'][0]['id'])" 2>/dev/null)

bench() {
  local label=$1 url=$2
  local sum=0 min=999 max=0 vals=""
  for i in $(seq 1 $N); do
    t=$(curl -s -o /dev/null -w '%{time_total}' "$url")
    vals="$vals $t"
    sum=$(python3 -c "print($sum + $t)")
    min=$(python3 -c "print(min($min, $t))")
    max=$(python3 -c "print(max($max, $t))")
  done
  avg=$(python3 -c "print(round($sum / $N, 3))")
  p50=$(echo $vals | tr ' ' '\n' | sort -n | sed -n "$((N/2))p")
  p95=$(echo $vals | tr ' ' '\n' | sort -n | sed -n "$((N * 95 / 100))p")
  printf "  %-30s avg=%ss  p50=%ss  p95=%ss  min=%ss  max=%ss\n" "$label" "$avg" "$p50" "$p95" "$min" "$max"
}

echo "Latency (warm, $N iterations):"
bench "GET /nodes/{id}" "$API_URL/nodes/$SLUG"
bench "GET /graph (full scan)" "$API_URL/graph"
bench "GET /search?q=serverless" "$API_URL/search?q=serverless"
bench "GET /nodes/404" "$API_URL/nodes/nonexistent-benchmark"
echo ""
echo "Done."
