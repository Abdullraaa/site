#!/usr/bin/env bash
set -euo pipefail
LOG_FILE="dev-host.log"
PID_FILE="dev-host.pid"

echo "[detach] Starting dev:host (frontend + backend) in background..."
# Ensure previous process is not lingering
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" || true)
  if [ -n "${OLD_PID}" ] && ps -p "$OLD_PID" > /dev/null 2>&1; then
    echo "[detach] Previous PID $OLD_PID still running. Stop it first (kill $OLD_PID) or remove $PID_FILE."
    exit 1
  fi
fi

# Start concurrently script detached
nohup npm run dev:host > "$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" > "$PID_FILE"

sleep 2
if ps -p "$PID" > /dev/null 2>&1; then
  echo "[detach] Started successfully. PID: $PID"
  echo "[detach] Logs: tail -f $LOG_FILE"
else
  echo "[detach] Failed to start. Check $LOG_FILE for details." >&2
  exit 1
fi
