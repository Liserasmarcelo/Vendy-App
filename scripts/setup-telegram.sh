#!/usr/bin/env bash

# =============================================================================
# Telegram Bot Webhook Setup Script
# =============================================================================
# Configures webhook for a Telegram bot using the Bot API.
#
# Usage:
#   ./scripts/setup-telegram.sh [bot_type]
#
# Arguments:
#   bot_type - "parent" (default) or "child"
#
# Environment variables required:
#   PARENT_BOT_TOKEN or CHILD_BOT_TOKEN - Bot token from @BotFather
#   WEBHOOK_URL - HTTPS URL for webhook (e.g., https://api.vendy.app/webhook)
#   WEBHOOK_SECRET (optional) - Secret token for webhook validation
#
# Examples:
#   ./scripts/setup-telegram.sh              # Setup parent bot
#   ./scripts/setup-telegram.sh parent       # Setup parent bot (explicit)
#   ./scripts/setup-telegram.sh child        # Setup child bot
#
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper functions
# =============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

die() {
  log_error "$1"
  exit 1
}

# =============================================================================
# Configuration
# =============================================================================

BOT_TYPE="${1:-parent}"

# Validate bot type
if [[ "$BOT_TYPE" != "parent" && "$BOT_TYPE" != "child" ]]; then
  die "Invalid bot type: $BOT_TYPE. Must be 'parent' or 'child'."
fi

# Determine token variable name
if [[ "$BOT_TYPE" == "parent" ]]; then
  TOKEN_VAR="PARENT_BOT_TOKEN"
  BOT_NAME="Parent Bot (@vendy_bot)"
else
  TOKEN_VAR="CHILD_BOT_TOKEN"
  BOT_NAME="Child Bot (@vendy_shop_bot)"
fi

log_info "Setting up $BOT_NAME webhook..."

# =============================================================================
# Load environment variables
# =============================================================================

# Try to load from .env file if it exists
ENV_FILE="${ENV_FILE:-.env}"
if [[ -f "$ENV_FILE" ]]; then
  log_info "Loading environment from $ENV_FILE"
  # Export all variables from .env (ignore comments and empty lines)
  set -a
  source "$ENV_FILE"
  set +a
fi

# Get bot token
BOT_TOKEN="${!TOKEN_VAR:-}"
if [[ -z "$BOT_TOKEN" ]]; then
  # Try fallback to generic BOT_TOKEN
  if [[ -n "${BOT_TOKEN:-}" ]]; then
    BOT_TOKEN="$BOT_TOKEN"
    log_warn "Using fallback BOT_TOKEN instead of $TOKEN_VAR"
  else
    die "$TOKEN_VAR environment variable is not set.\nPlease set it in your .env file or environment."
  fi
fi

# Validate token format
if [[ ! "$BOT_TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
  die "Invalid bot token format. Expected: <numbers>:<alphanumeric>"
fi

# Get webhook URL
WEBHOOK_URL="${WEBHOOK_URL:-}"
if [[ -z "$WEBHOOK_URL" ]]; then
  die "WEBHOOK_URL environment variable is not set.\nExample: https://api.vendy.app/webhook"
fi

# Validate HTTPS (Telegram requirement)
if [[ ! "$WEBHOOK_URL" =~ ^https:// ]]; then
  die "Webhook URL must use HTTPS (Telegram requirement).\nCurrent: $WEBHOOK_URL"
fi

# Get optional webhook secret
WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"

# =============================================================================
# Telegram API helper
# =============================================================================

API_BASE="https://api.telegram.org/bot${BOT_TOKEN}"

api_call() {
  local method="$1"
  shift
  local response
  local http_code

  response=$(curl -s -w "\n%{http_code}" "${API_BASE}/${method}" "$@" 2>/dev/null || true)

  if [[ -z "$response" ]]; then
    die "Failed to connect to Telegram API. Check your internet connection."
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" != "200" ]]; then
    die "Telegram API returned HTTP $http_code\nResponse: $body"
  fi

  echo "$body"
}

# =============================================================================
# Step 1: Verify bot token
# =============================================================================

log_info "Step 1: Verifying bot token..."

BOT_INFO=$(api_call "getMe")

if ! echo "$BOT_INFO" | grep -q '"ok":true'; then
  error_desc=$(echo "$BOT_INFO" | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
  die "Bot token verification failed: ${error_desc:-Unknown error}"
fi

BOT_USERNAME=$(echo "$BOT_INFO" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
BOT_ID=$(echo "$BOT_INFO" | grep -o '"id":[0-9]*' | cut -d':' -f2)

log_success "Bot verified: @$BOT_USERNAME (ID: $BOT_ID)"

# =============================================================================
# Step 2: Get current webhook info
# =============================================================================

log_info "Step 2: Checking current webhook configuration..."

WEBHOOK_INFO=$(api_call "getWebhookInfo")

CURRENT_URL=$(echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
PENDING_COUNT=$(echo "$WEBHOOK_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
LAST_ERROR=$(echo "$WEBHOOK_INFO" | grep -o '"last_error_message":"[^"]*"' | cut -d'"' -f4 || echo "None")

if [[ -n "$CURRENT_URL" && "$CURRENT_URL" != "" ]]; then
  log_info "Current webhook URL: $CURRENT_URL"
  log_info "Pending updates: $PENDING_COUNT"
  if [[ "$LAST_ERROR" != "None" ]]; then
    log_warn "Last error: $LAST_ERROR"
  fi
else
  log_info "No webhook currently configured (using polling or new bot)"
fi

# =============================================================================
# Step 3: Delete existing webhook (optional but recommended)
# =============================================================================

if [[ -n "$CURRENT_URL" && "$CURRENT_URL" != "" ]]; then
  log_info "Step 3: Removing existing webhook..."

  DELETE_RESULT=$(api_call "deleteWebhook" -d '{"drop_pending_updates":false}')

  if echo "$DELETE_RESULT" | grep -q '"ok":true'; then
    log_success "Existing webhook removed"
  else
    log_warn "Failed to remove existing webhook (continuing anyway)"
  fi
fi

# =============================================================================
# Step 4: Set new webhook
# =============================================================================

log_info "Step 4: Setting new webhook..."
log_info "  URL: $WEBHOOK_URL"
log_info "  Max connections: 40"

# Build webhook parameters
WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "url": "$WEBHOOK_URL",
  "max_connections": 40,
  "allowed_updates": ["message", "callback_query", "inline_query", "pre_checkout_query", "successful_payment"]
}
EOF
)

# Add secret token if available
if [[ -n "$WEBHOOK_SECRET" ]]; then
  log_info "  Secret token: ${WEBHOOK_SECRET:0:8}... (hidden)"
  WEBHOOK_PAYLOAD=$(echo "$WEBHOOK_PAYLOAD" | sed "s/}$/, \"secret_token\": \"$WEBHOOK_SECRET\" }/")
fi

SET_RESULT=$(api_call "setWebhook" -H "Content-Type: application/json" -d "$WEBHOOK_PAYLOAD")

if echo "$SET_RESULT" | grep -q '"ok":true'; then
  log_success "Webhook configured successfully"
else
  error_desc=$(echo "$SET_RESULT" | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
  die "Failed to set webhook: ${error_desc:-Unknown error}"
fi

# =============================================================================
# Step 5: Verify webhook configuration
# =============================================================================

log_info "Step 5: Verifying webhook configuration..."

VERIFY_INFO=$(api_call "getWebhookInfo")

VERIFY_URL=$(echo "$VERIFY_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
VERIFY_PENDING=$(echo "$VERIFY_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
VERIFY_HAS_SECRET=$(echo "$VERIFY_INFO" | grep -q '"has_custom_certificate":true' && echo "Yes" || echo "No")

if [[ "$VERIFY_URL" == "$WEBHOOK_URL" ]]; then
  log_success "Webhook URL verified: $VERIFY_URL"
else
  log_warn "Webhook URL mismatch!"
  log_warn "  Expected: $WEBHOOK_URL"
  log_warn "  Actual:   $VERIFY_URL"
fi

log_info "  Pending updates: $VERIFY_PENDING"
log_info "  Custom certificate: $VERIFY_HAS_SECRET"

# Check for errors
VERIFY_LAST_ERROR=$(echo "$VERIFY_INFO" | grep -o '"last_error_message":"[^"]*"' | cut -d'"' -f4 || echo "None")
if [[ "$VERIFY_LAST_ERROR" != "None" ]]; then
  log_warn "  Last error: $VERIFY_LAST_ERROR"
  log_warn "  Webhook may not be working correctly!"
else
  log_success "  No errors detected"
fi

# =============================================================================
# Step 6: Test webhook delivery (optional)
# =============================================================================

if [[ "${TEST_WEBHOOK:-true}" == "true" ]]; then
  log_info "Step 6: Testing webhook delivery..."

  # Send a test message to ourselves to trigger a webhook
  # This requires the bot to be in a chat, so we skip if it fails
  TEST_MESSAGE_RESULT=$(api_call "sendMessage" \
    -d "chat_id=${BOT_ID}" \
    -d "text=Webhook test $(date +%s)" \
    -d "disable_notification=true" 2>/dev/null || echo '{"ok":false}')

  if echo "$TEST_MESSAGE_RESULT" | grep -q '"ok":true'; then
    log_success "Test message sent, waiting for webhook delivery..."

    # Wait a moment and check for pending updates
    sleep 2

    FINAL_INFO=$(api_call "getWebhookInfo")
    FINAL_PENDING=$(echo "$FINAL_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)

    if [[ "$FINAL_PENDING" -eq 0 ]]; then
      log_success "Webhook delivery confirmed! (0 pending updates)"
    else
      log_warn "Webhook delivery may be delayed ($FINAL_PENDING pending updates)"
      log_warn "This is normal if the server is not running yet"
    fi
  else
    log_warn "Could not send test message (bot may not be in a chat)"
    log_warn "Webhook configuration is set, but test was skipped"
  fi
fi

# =============================================================================
# Step 7: Display summary
# =============================================================================

echo ""
echo "============================================================================="
echo "                    WEBHOOK SETUP COMPLETE"
echo "============================================================================="
echo ""
echo "  Bot:           @$BOT_USERNAME"
echo "  Bot ID:        $BOT_ID"
echo "  Bot Type:      $BOT_TYPE"
echo "  Webhook URL:   $WEBHOOK_URL"
echo "  Secret Token:  $([[ -n "$WEBHOOK_SECRET" ]] && echo "Configured (hidden)" || echo "Not configured")"
echo "  Pending:       $VERIFY_PENDING updates"
echo ""
echo "  Environment variables used:"
echo "    $TOKEN_VAR=${BOT_TOKEN:0:10}..."
echo "    WEBHOOK_URL=$WEBHOOK_URL"
[[ -n "$WEBHOOK_SECRET" ]] && echo "    WEBHOOK_SECRET=${WEBHOOK_SECRET:0:8}..."
echo ""
echo "============================================================================="
echo ""

log_info "Next steps:"
echo "  1. Ensure your server is running and accessible at $WEBHOOK_URL"
echo "  2. Verify the server handles POST requests at /webhook"
echo "  3. Check server logs for incoming webhook updates"
echo "  4. Monitor pending updates with: ./scripts/setup-telegram.sh $BOT_TYPE"
echo ""

# =============================================================================
# Optional: Set bot commands
# =============================================================================

if [[ "${SET_COMMANDS:-true}" == "true" ]]; then
  log_info "Setting bot commands..."

  if [[ "$BOT_TYPE" == "parent" ]]; then
    COMMANDS_PAYLOAD='{"commands":[
      {"command":"start","description":"Start using Vendy"},
      {"command":"help","description":"Show help and commands"},
      {"command":"language","description":"Change language / Cambiar idioma"}
    ]}'
  else
    COMMANDS_PAYLOAD='{"commands":[
      {"command":"start","description":"Open your store catalog"},
      {"command":"catalog","description":"Browse products"},
      {"command":"cart","description":"View your cart"},
      {"command":"orders","description":"View your orders"}
    ]}'
  fi

  COMMANDS_RESULT=$(api_call "setMyCommands" -H "Content-Type: application/json" -d "$COMMANDS_PAYLOAD" 2>/dev/null || echo '{"ok":false}')

  if echo "$COMMANDS_RESULT" | grep -q '"ok":true'; then
    log_success "Bot commands configured"
  else
    log_warn "Could not set bot commands (non-critical)"
  fi
fi

# =============================================================================
# Optional: Set bot description
# =============================================================================

if [[ "${SET_DESCRIPTION:-true}" == "true" && "$BOT_TYPE" == "parent" ]]; then
  log_info "Setting bot description..."

  DESCRIPTION="Vendy - Your store-as-a-service platform. Create your own store, sell products, and manage orders all within Telegram. Tap /start to open the app."

  DESC_RESULT=$(api_call "setMyDescription" \
    -d "description=${DESCRIPTION}" 2>/dev/null || echo '{"ok":false}')

  if echo "$DESC_RESULT" | grep -q '"ok":true'; then
    log_success "Bot description set"
  else
    log_warn "Could not set bot description (non-critical)"
  fi
fi

log_success "Setup complete for $BOT_NAME!"
