#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATIC_DIR="${SCRIPT_DIR}/static"
ENV_FILE="${SCRIPT_DIR}/.env.deploy"
S3_BUCKET="mockinator.io"
CLOUDFRONT_DISTRIBUTION_ID="E28PIU7I1XTAWM"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: Environment file not found: $ENV_FILE"
  exit 1
fi

if [[ ! -d "$STATIC_DIR" ]]; then
  echo "Error: Static directory not found: $STATIC_DIR"
  exit 1
fi

echo "Loading AWS config from $ENV_FILE"
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

echo "Deploying to $S3_BUCKET..."
aws s3 sync "$STATIC_DIR" "s3://${S3_BUCKET}/" --delete

echo "Invalidating CloudFront distribution $CLOUDFRONT_DISTRIBUTION_ID..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*"

echo "Deploy complete."
