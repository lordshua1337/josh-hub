#!/usr/bin/env bash
# Claude Code Stop-event hook for prometheus-hub session ingester.
#
# Install:
#   1. Wire this script into ~/.claude/settings.json under hooks.Stop:
#      {
#        "hooks": {
#          "Stop": [
#            { "matcher": "*",
#              "hooks": [
#                { "type": "command",
#                  "command": "/Users/joshhohenstein/projects/josh-hub/scripts/stop-hook.sh" }
#              ]
#            }
#          ]
#        }
#      }
#   2. chmod +x this file.
#
# Runs the ingester in the background so it doesn't block the agent's exit.
# Output is logged but errors are silenced (the cron job is the safety net).

INGESTER="/Users/joshhohenstein/projects/josh-hub/scripts/ingest-sessions.mjs"
LOG="/Users/joshhohenstein/Library/Logs/prometheus-hub-ingest-hook.log"

if [[ ! -f "$INGESTER" ]]; then
  exit 0
fi

(
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Stop hook fired" >> "$LOG"
  /usr/local/bin/node "$INGESTER" --limit=3 >> "$LOG" 2>&1
) &

disown
exit 0
