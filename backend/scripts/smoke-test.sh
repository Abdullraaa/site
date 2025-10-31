#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:4000}

echo "Running backend smoke tests against $BASE"

fail() {
  echo "[FAIL] $1"
  exit 1
}

ok() { echo "[PASS] $1"; }

echo "1) Health check"
STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/health" || true)
if [ "$STATUS" != "200" ]; then
  fail "Health endpoint returned $STATUS"
else
  ok "Health returned 200"
fi

echo "2) List products"
BODY=$(curl -sS "$BASE/api/products" || true)
if [ -z "$BODY" ]; then
  fail "No response from /api/products"
fi
echo "$BODY" | grep -q '"products":' || fail "Response missing products array"
ok "Products endpoint returned a products array"

echo "3) Single product by slug (square-tee)"
BODY=$(curl -sS "$BASE/api/products/square-tee" || true)
[ -n "$BODY" ] || fail "No response from /api/products/square-tee"
echo "$BODY" | grep -q '"slug":"square-tee"' || echo "Warning: slug not found in response"
ok "Single product endpoint responded"

echo "4) Checkout (create WhatsApp)"
PAYLOAD='{"items":[{"id":1,"title":"SQUARE TEE","qty":1,"price":45.00}],"total":45.00,"customer":{"name":"Smoke Tester","phone":"1234567890"}}'
RESPONSE=$(curl -sS -X POST "$BASE/api/checkout/create-whatsapp" -H "Content-Type: application/json" -d "$PAYLOAD" || true)
echo "$RESPONSE" | grep -q '"whatsappUrl"' || fail "Checkout response missing whatsappUrl"
echo "$RESPONSE" | grep -q '"reference"' || fail "Checkout response missing reference"
ok "Checkout endpoint created order and returned whatsappUrl"

echo "All smoke tests passed."

exit 0
