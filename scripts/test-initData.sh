#!/usr/bin/env bash

# =============================================================================
# Telegram initData Test Generator
# =============================================================================
# Generates a valid initData string signed with HMAC-SHA256 for testing.
# Useful for testing API endpoints without opening Telegram.
#
# Usage:
#   ./scripts/test-initData.sh [options]
#
# Options:
#   -u, --user-id <id>        User ID (default: 123456789)
#   -f, --first-name <name>   First name (default: Test)
#   -l, --last-name <name>    Last name (default: User)
#   -n, --username <name>     Username (default: testuser)
#   -c, --language <code>     Language code (default: en)
#   -p, --premium             Mark user as premium
#   -s, --start-param <param> Start parameter / referral code
#   -a, --auth-date <unix>    Auth date (default: now)
#   -e, --expired             Generate expired initData (for testing 401)
#   -t, --tampered            Generate tampered initData (for testing 401)
#   -m, --missing-hash        Generate initData without hash (for testing 401)
#   -o, --output <format>     Output format: raw|curl|json|env (default: raw)
#   -b, --bot-token <token>   Bot token (default: from .env PARENT_BOT_TOKEN)
#   -h, --help                Show this help
#
# Examples:
#   ./scripts/test-initData.sh                    # Basic test initData
#   ./scripts/test-initData.sh -u 999 -f "María"   # Custom user
#   ./scripts/test-initData.sh -s shop_123         # With referral code
#   ./scripts/test-initData.sh -e                  # Expired (test 401)
#   ./scripts/test-initData.sh -o curl             # Output as curl command
#   ./scripts/test-initData.sh -o env              # Output as .env line
#
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_data() { echo -e "${CYAN}[DATA]${NC} $1"; }

die() { log_error "$1"; exit 1; }

# =============================================================================
# Default values
# =============================================================================

USER_ID="123456789"
FIRST_NAME="Test"
LAST_NAME="User"
USERNAME="testuser"
LANGUAGE_CODE="en"
IS_PREMIUM="false"
START_PARAM=""
AUTH_DATE=""
EXPIRED="false"
TAMPERED="false"
MISSING_HASH="false"
OUTPUT_FORMAT="raw"
BOT_TOKEN=""

# =============================================================================
# Parse arguments
# =============================================================================

while [[ $# -gt 0 ]]; do
  case $1 in
    -u|--user-id)
      USER_ID="$2"
      shift 2
      ;;
    -f|--first-name)
      FIRST_NAME="$2"
      shift 2
      ;;
    -l|--last-name)
      LAST_NAME="$2"
      shift 2
      ;;
    -n|--username)
      USERNAME="$2"
      shift 2
      ;;
    -c|--language)
      LANGUAGE_CODE="$2"
      shift 2
      ;;
    -p|--premium)
      IS_PREMIUM="true"
      shift
      ;;
    -s|--start-param)
      START_PARAM="$2"
      shift 2
      ;;
    -a|--auth-date)
      AUTH_DATE="$2"
      shift 2
      ;;
    -e|--expired)
      EXPIRED="true"
      shift
      ;;
    -t|--tampered)
      TAMPERED="true"
      shift
      ;;
    -m|--missing-hash)
      MISSING_HASH="true"
      shift
      ;;
    -o|--output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    -b|--bot-token)
      BOT_TOKEN="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      die "Unknown option: $1\nUse --help for usage information."
      ;;
  esac
done

# Validate output format
if [[ "$OUTPUT_FORMAT" != "raw" && "$OUTPUT_FORMAT" != "curl" && "$OUTPUT_FORMAT" != "json" && "$OUTPUT_FORMAT" != "env" ]]; then
  die "Invalid output format: $OUTPUT_FORMAT. Must be raw, curl, json, or env."
fi

# =============================================================================
# Show help
# =============================================================================

show_help() {
  cat << 'EOF'
Telegram initData Test Generator

Generates a valid initData string signed with HMAC-SHA256 for testing API
endpoints without opening Telegram.

USAGE:
  ./scripts/test-initData.sh [OPTIONS]

OPTIONS:
  -u, --user-id <id>        User ID (default: 123456789)
  -f, --first-name <name>   First name (default: Test)
  -l, --last-name <name>    Last name (default: User)
  -n, --username <name>     Username (default: testuser)
  -c, --language <code>     Language code (default: en)
  -p, --premium             Mark user as premium
  -s, --start-param <param> Start parameter / referral code
  -a, --auth-date <unix>    Auth date as Unix timestamp (default: now)
  -e, --expired             Generate expired initData (auth_date = 7 days ago)
  -t, --tampered            Generate tampered initData (wrong user ID)
  -m, --missing-hash        Generate initData without hash parameter
  -o, --output <format>     Output format: raw|curl|json|env (default: raw)
  -b, --bot-token <token>   Bot token (default: from .env)
  -h, --help                Show this help

EXAMPLES:
  # Basic test initData
  ./scripts/test-initData.sh

  # Custom user with referral code
  ./scripts/test-initData.sh -u 999 -f "María" -s shop_123

  # Expired initData (for testing 401 response)
  ./scripts/test-initData.sh -e

  # Tampered initData (for testing 401 response)
  ./scripts/test-initData.sh -t

  # Output as curl command for quick API testing
  ./scripts/test-initData.sh -o curl

  # Output as .env line for pasting into environment
  ./scripts/test-initData.sh -o env

OUTPUT FORMATS:
  raw   - Just the initData string (default)
  curl  - Complete curl command with the initData
  json  - JSON object with initData and decoded info
  env   - Export statement for .env files
EOF
}

# =============================================================================
# Load environment
# =============================================================================

if [[ -z "$BOT_TOKEN" ]]; then
  ENV_FILE="${ENV_FILE:-.env}"
  if [[ -f "$ENV_FILE" ]]; then
    log_info "Loading bot token from $ENV_FILE"
    # Extract token from .env
    BOT_TOKEN=$(grep -E '^PARENT_BOT_TOKEN=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' || true)
    if [[ -z "$BOT_TOKEN" ]]; then
      BOT_TOKEN=$(grep -E '^BOT_TOKEN=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' || true)
    fi
  fi
fi

if [[ -z "$BOT_TOKEN" ]]; then
  die "Bot token not found.\nProvide via --bot-token or set PARENT_BOT_TOKEN in .env"
fi

# Validate token format
if [[ ! "$BOT_TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
  die "Invalid bot token format. Expected: <numbers>:<alphanumeric>"
fi

log_info "Using bot token: ${BOT_TOKEN:0:10}..."

# =============================================================================
# Build user JSON
# =============================================================================

if [[ "$IS_PREMIUM" == "true" ]]; then
  USER_JSON=$(cat <<EOF
{"id":$USER_ID,"first_name":"$FIRST_NAME","last_name":"$LAST_NAME","username":"$USERNAME","language_code":"$LANGUAGE_CODE","is_premium":true}
EOF
)
else
  USER_JSON=$(cat <<EOF
{"id":$USER_ID,"first_name":"$FIRST_NAME","last_name":"$LAST_NAME","username":"$USERNAME","language_code":"$LANGUAGE_CODE"}
EOF
)
fi

# =============================================================================
# Calculate auth_date
# =============================================================================

if [[ -n "$AUTH_DATE" ]]; then
  AUTH_DATE_VAL="$AUTH_DATE"
elif [[ "$EXPIRED" == "true" ]]; then
  AUTH_DATE_VAL=$(($(date +%s) - 604800))  # 7 days ago
  log_warn "Generating EXPIRED initData (7 days ago)"
else
  AUTH_DATE_VAL=$(date +%s)
fi

# =============================================================================
# Build data check string
# =============================================================================

# URL-encode the user JSON
USER_ENCODED=$(echo "$USER_JSON" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))" 2>/dev/null || \
  node -e "console.log(encodeURIComponent(process.argv[1]))" "$USER_JSON" 2>/dev/null || \
  die "Need python3 or node for URL encoding")

# Build parameters
PARAMS=""
PARAMS="${PARAMS}auth_date=${AUTH_DATE_VAL}\n"
PARAMS="${PARAMS}user=${USER_ENCODED}"

if [[ -n "$START_PARAM" ]]; then
  PARAMS="${PARAMS}\nstart_param=${START_PARAM}"
fi

# =============================================================================
# Calculate HMAC-SHA256
# =============================================================================

# Create secret key: HMAC-SHA256("WebAppData", botToken)
SECRET_KEY=$(echo -n "WebAppData" | openssl dgst -sha256 -hmac "$BOT_TOKEN" -binary | xxd -p -c 64)

# Calculate hash: HMAC-SHA256(secretKey, dataCheckString)
HASH=$(printf '%b' "$PARAMS" | openssl dgst -sha256 -mac HMAC -macopt hexkey:"$SECRET_KEY" -binary | xxd -p -c 64)

# =============================================================================
# Build final initData
# =============================================================================

if [[ "$MISSING_HASH" == "true" ]]; then
  log_warn "Generating initData WITHOUT hash (will fail validation)"
  INIT_DATA="auth_date=${AUTH_DATE_VAL}&user=${USER_ENCODED}"
  if [[ -n "$START_PARAM" ]]; then
    INIT_DATA="${INIT_DATA}&start_param=${START_PARAM}"
  fi
elif [[ "$TAMPERED" == "true" ]]; then
  log_warn "Generating TAMPERED initData (wrong user ID, will fail validation)"
  TAMPERED_USER=$(echo "$USER_JSON" | sed 's/"id":[0-9]*/"id":999999999/')
  TAMPERED_ENCODED=$(echo "$TAMPERED_USER" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))" 2>/dev/null || \
    node -e "console.log(encodeURIComponent(process.argv[1]))" "$TAMPERED_USER" 2>/dev/null)
  INIT_DATA="auth_date=${AUTH_DATE_VAL}&hash=${HASH}&user=${TAMPERED_ENCODED}"
  if [[ -n "$START_PARAM" ]]; then
    INIT_DATA="${INIT_DATA}&start_param=${START_PARAM}"
  fi
else
  INIT_DATA="auth_date=${AUTH_DATE_VAL}&hash=${HASH}&user=${USER_ENCODED}"
  if [[ -n "$START_PARAM" ]]; then
    INIT_DATA="${INIT_DATA}&start_param=${START_PARAM}"
  fi
fi

# =============================================================================
# Output
# =============================================================================

case "$OUTPUT_FORMAT" in
  raw)
    echo "$INIT_DATA"
    ;;

  curl)
    API_URL="${API_URL:-https://api.vendy.app}"
    ENDPOINT="${ENDPOINT:-/api/products}"
    echo "curl -X GET \"${API_URL}${ENDPOINT}\" \\"
    echo "  -H \"X-Telegram-Init-Data: ${INIT_DATA}\" \\"
    echo "  -H \"Accept: application/json\""
    ;;

  json)
    echo "{"
    echo "  \"initData\": \"$INIT_DATA\","
    echo "  \"decoded\": {"
    echo "    \"user\": $USER_JSON,"
    echo "    \"auth_date\": $AUTH_DATE_VAL,"
    echo "    \"hash\": \"$HASH\","
    [[ -n "$START_PARAM" ]] && echo "    \"start_param\": \"$START_PARAM\","
    echo "    \"is_expired\": $EXPIRED,"
    echo "    \"is_tampered\": $TAMPERED,"
    echo "    \"is_missing_hash\": $MISSING_HASH"
    echo "  }"
    echo "}"
    ;;

  env)
    echo "TEST_INIT_DATA=\"$INIT_DATA\""
    ;;
esac

# =============================================================================
# Summary (for non-raw output)
# =============================================================================

if [[ "$OUTPUT_FORMAT" != "raw" ]]; then
  echo ""
  log_success "initData generated successfully"
  log_info "User: $FIRST_NAME $LAST_NAME (@$USERNAME, ID: $USER_ID)"
  log_info "Auth date: $AUTH_DATE_VAL ($(date -r "$AUTH_DATE_VAL" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$AUTH_DATE_VAL" '+%Y-%m-%d %H:%M:%S'))"
  [[ -n "$START_PARAM" ]] && log_info "Start param: $START_PARAM"
  [[ "$EXPIRED" == "true" ]] && log_warn "This initData is EXPIRED (will fail validation)"
  [[ "$TAMPERED" == "true" ]] && log_warn "This initData is TAMPERED (will fail validation)"
  [[ "$MISSING_HASH" == "true" ]] && log_warn "This initData has NO HASH (will fail validation)"
fi
