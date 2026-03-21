#!/usr/bin/env bash
set -euo pipefail

# Deploy frontend to S3 + CloudFront with proper cache headers
# Usage: ./scripts/deploy-frontend.sh

BUCKET="ssb-dev-frontend"
DISTRIBUTION="E223XWOJB73WBS"
OUT_DIR="frontend/dist"

if [ ! -d "$OUT_DIR" ]; then
  echo "Error: $OUT_DIR not found. Run 'npx next build' first."
  exit 1
fi

echo "Deploying to s3://$BUCKET..."

# Hashed assets (JS/CSS/images) — immutable, long cache
aws s3 sync "$OUT_DIR/_next/" "s3://$BUCKET/_next/" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --quiet

# HTML + txt (RSC payloads) — no cache, always fresh
aws s3 sync "$OUT_DIR/" "s3://$BUCKET/" \
  --delete \
  --exclude "_next/*" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --quiet

echo "Invalidating CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "Invalidation $INVALIDATION_ID created. Waiting..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION" \
  --id "$INVALIDATION_ID"

echo "Deploy complete."
