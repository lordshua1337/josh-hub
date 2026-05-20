# prometheus-hub scripts

Local daemons and one-shots that keep the command center current.

## Setup (one-time)

1. **Grab the Supabase service-role key** (writes bypass RLS):
   https://supabase.com/dashboard/project/rpejicodkvqocbgtasor/settings/api
   Copy the `service_role` secret into `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
   Also add it to Vercel: `vercel env add SUPABASE_SERVICE_ROLE_KEY production`.

2. **(Optional) Anthropic API key** for session summarization via Haiku:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   Without this, sessions are ingested but `summary` stays null.

## ingest-sessions.mjs (P2)

Walks `~/.claude/projects/**/*.jsonl`, parses each session, upserts to
`sessions` + `tool_usage`. Idempotent via `external_id = absolute file path`.

```bash
node scripts/ingest-sessions.mjs                      # all files
node scripts/ingest-sessions.mjs --limit=10           # 10 newest
node scripts/ingest-sessions.mjs --since=2026-05-01   # since date
node scripts/ingest-sessions.mjs --dry-run            # parse but don't write
node scripts/ingest-sessions.mjs --file=/path/foo.jsonl  # single file
```

### Schedule via launchd (every 15 min)

```bash
cp scripts/launchd/com.prometheushub.ingest-sessions.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.prometheushub.ingest-sessions.plist
launchctl start com.prometheushub.ingest-sessions  # immediate first run
```

To stop:
```bash
launchctl unload ~/Library/LaunchAgents/com.prometheushub.ingest-sessions.plist
```

Logs: `~/Library/Logs/prometheus-hub-ingest.{log,err}`

### Schedule via Claude Code Stop hook (real-time)

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          { "type": "command",
            "command": "/Users/joshhohenstein/projects/josh-hub/scripts/stop-hook.sh" }
        ]
      }
    ]
  }
}
```

The hook fires on every session end. It runs the ingester for the 3 newest
files in the background so it doesn't block.

## gen-xp-seed.mjs (P1)

Regenerates `supabase/migrations/0005_seed_xp_events.sql` from
`lib/cc-state.ts`. Run when you edit the XP log directly in TypeScript.

```bash
node scripts/gen-xp-seed.mjs
```
