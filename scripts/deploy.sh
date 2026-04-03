#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy.sh [local|dev|stg|prd]

Examples:
  ./scripts/deploy.sh dev
  ./scripts/deploy.sh stg
  ./scripts/deploy.sh prd
  ./scripts/deploy.sh local
EOF
}

error() {
  echo "Error: $*" >&2
  exit 1
}

info() {
  echo "==> $*"
}

ENVIRONMENT="${1:-}"

if [[ -z "$ENVIRONMENT" ]]; then
  usage
  error "Environment is required."
fi

case "$ENVIRONMENT" in
  local|dev|stg|prd)
    ;;
  *)
    usage
    error "Invalid environment '$ENVIRONMENT'. Expected one of: local, dev, stg, prd."
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"

if [[ ! -f "$ENV_FILE" ]]; then
  error "Environment file not found: $ENV_FILE"
fi

if [[ -f "${PROJECT_ROOT}/index.html" ]]; then
  PUBLISH_DIR="$PROJECT_ROOT"
elif [[ -f "${PROJECT_ROOT}/static/index.html" ]]; then
  PUBLISH_DIR="${PROJECT_ROOT}/static"
else
  error "No build output found. Expected index.html in project root or static/index.html."
fi

command -v aws >/dev/null 2>&1 || error "AWS CLI is not installed or not on PATH."

info "Loading environment from $ENV_FILE"
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
S3_BUCKET="${S3_BUCKET:-}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"

[[ -n "$AWS_ACCESS_KEY_ID" ]] || error "AWS_ACCESS_KEY_ID is missing in $ENV_FILE"
[[ -n "$AWS_SECRET_ACCESS_KEY" ]] || error "AWS_SECRET_ACCESS_KEY is missing in $ENV_FILE"
[[ -n "$AWS_REGION" ]] || error "AWS_REGION is missing in $ENV_FILE"
[[ -n "$S3_BUCKET" ]] || error "S3_BUCKET is missing in $ENV_FILE"

info "Checking S3 bucket: $S3_BUCKET"
if ! aws s3api head-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" >/dev/null 2>&1; then
  error "S3 bucket '$S3_BUCKET' does not exist or is not accessible in region '$AWS_REGION'."
fi

info "Deploying static assets from $PUBLISH_DIR to s3://$S3_BUCKET/"
aws s3 sync "$PUBLISH_DIR/" "s3://$S3_BUCKET/" \
  --region "$AWS_REGION" \
  --delete \
  --exclude ".git*" \
  --exclude ".env*" \
  --exclude "scripts/*" \
  --exclude "node_modules/*" \
  --exclude "*.md" \
  --exclude "README*"

info "Ensuring correct MIME types for HTML, CSS, and JS"
while IFS= read -r -d '' file; do
  relative_path="${file#${PUBLISH_DIR}/}"
  case "$file" in
    *.html) content_type="text/html; charset=utf-8" ;;
    *.css) content_type="text/css; charset=utf-8" ;;
    *.js) content_type="application/javascript; charset=utf-8" ;;
    *) continue ;;
  esac

  aws s3 cp "$file" "s3://$S3_BUCKET/$relative_path" \
    --region "$AWS_REGION" \
    --content-type "$content_type" \
    --metadata-directive REPLACE >/dev/null
 done < <(find "$PUBLISH_DIR" -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) -print0)

if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
  info "Creating CloudFront invalidation for distribution $CLOUDFRONT_DISTRIBUTION_ID"
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths '/*' \
    --region "$AWS_REGION" >/dev/null
else
  info "Skipping CloudFront invalidation (CLOUDFRONT_DISTRIBUTION_ID not set)"
fi

DEPLOY_URL="https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/"
info "Deployment complete"
echo "$DEPLOY_URL"
