#!/usr/bin/env node
// P2 — Session ingester
//
// Walks ~/.claude/projects/**/*.jsonl, parses each session's metadata
// (start/end, message count, token usage, tool calls), detects which project
// it belongs to, and upserts into Supabase sessions + tool_usage tables.
//
// Idempotent: external_id = absolute file path. Re-running updates in place.
//
// Env vars required (read from .env.local at the repo root or process.env):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    (writes bypass RLS)
//   ANTHROPIC_API_KEY            (optional — enables Haiku summarization)
//
// Usage:
//   node scripts/ingest-sessions.mjs [--since=ISO_DATE] [--limit=N] [--dry-run]
//   node scripts/ingest-sessions.mjs --file=/path/to/specific.jsonl

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

// ---------------- env loading ----------------
async function loadEnv() {
  const envPath = path.join(import.meta.dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// ---------------- args ----------------
function parseArgs() {
  const args = { since: null, limit: Infinity, dryRun: false, file: null };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--since=")) args.since = new Date(a.slice(8));
    else if (a.startsWith("--limit=")) args.limit = parseInt(a.slice(8), 10);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a.startsWith("--file=")) args.file = a.slice(7);
  }
  return args;
}

// ---------------- file discovery ----------------
async function findJsonl(root) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(full);
    }
  }
  await walk(root);
  return out;
}

// ---------------- project detection ----------------

// Fallback slug list — mirrors migration 0003. Used when service-role-less
// fetch returns 0 rows (RLS-locked). Kept in sync manually for now; P6 wires
// the real fetch via the server-side client.
const SLUG_FALLBACK = [
  "ad-intelligence", "auth-billing-kit", "balanceboss", "bashbox", "cash-cow",
  "ctax-api-proxy", "ctax-partner-site", "doodleforge", "event-bus", "headless-cms",
  "image-forge", "josh-hub", "lifeforge", "marcom-engine", "oculus",
  "partner-portal-templates", "pipeline-simulator", "project-switcher", "stock-pilot",
  "the-well", "trend-sniper", "uncommon-cents",
];

async function loadKnownSlugs() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return SLUG_FALLBACK;
  try {
    const res = await fetch(`${url}/rest/v1/projects?select=slug&order=slug`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return SLUG_FALLBACK;
    const rows = await res.json();
    if (rows.length === 0) return SLUG_FALLBACK;
    return rows.map((r) => r.slug);
  } catch {
    return SLUG_FALLBACK;
  }
}

function detectProject(jsonlPath, knownSlugs) {
  // Path looks like: ~/.claude/projects/-Users-joshhohenstein-projects-<slug>(--claude-worktrees-X)?/<uuid>.jsonl
  // Or for subagent transcripts: ~/.claude/projects/<encoded-project>/<uuid>/subagents/agent-XXX.jsonl
  // Scan the full path string against known slugs (longest-first to avoid prefix collisions).
  const sorted = [...knownSlugs].sort((a, b) => b.length - a.length);
  for (const slug of sorted) {
    if (jsonlPath.includes(`projects-${slug}`)) return slug;
  }
  return null;
}

// ---------------- session parsing ----------------
function parseSession(filePath, lines) {
  const session = {
    started_at: null,
    ended_at: null,
    message_count: 0,
    tokens_in: 0,
    tokens_out: 0,
    tokens_cache_read: 0,
    tokens_cache_write: 0,
    model: null,
    tool_calls: {}, // tool_name -> { count, first, last }
    excerpt: [],
  };

  for (const raw of lines) {
    if (!raw.trim()) continue;
    let o;
    try {
      o = JSON.parse(raw);
    } catch {
      continue;
    }
    const t = o.type;
    const ts = o.timestamp ? new Date(o.timestamp) : null;
    if (ts && !isNaN(ts.getTime())) {
      if (!session.started_at || ts < session.started_at) session.started_at = ts;
      if (!session.ended_at || ts > session.ended_at) session.ended_at = ts;
    }
    if (t === "user" || t === "assistant") {
      session.message_count++;
    }
    if (t === "assistant") {
      const msg = o.message || {};
      const usage = msg.usage || {};
      session.tokens_in += (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
      session.tokens_out += usage.output_tokens || 0;
      session.tokens_cache_read += usage.cache_read_input_tokens || 0;
      session.tokens_cache_write += usage.cache_creation_input_tokens || 0;
      if (msg.model && !session.model) session.model = msg.model;
      const content = msg.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block && block.type === "tool_use" && block.name) {
            const name = String(block.name);
            const cur = session.tool_calls[name] || { count: 0, first: ts, last: ts };
            cur.count++;
            if (ts) {
              if (!cur.first || ts < cur.first) cur.first = ts;
              if (!cur.last || ts > cur.last) cur.last = ts;
            }
            session.tool_calls[name] = cur;
          }
          if (block && block.type === "text" && typeof block.text === "string" && session.excerpt.length < 5) {
            session.excerpt.push({ role: "assistant", preview: block.text.slice(0, 240) });
          }
        }
      } else if (typeof content === "string" && session.excerpt.length < 5) {
        session.excerpt.push({ role: "assistant", preview: content.slice(0, 240) });
      }
    } else if (t === "user") {
      const msg = o.message || {};
      const content = msg.content;
      const txt = typeof content === "string" ? content : null;
      if (txt && session.excerpt.length < 5) {
        session.excerpt.push({ role: "user", preview: txt.slice(0, 240) });
      }
    }
  }

  // duration in minutes
  if (session.started_at && session.ended_at) {
    session.duration_min = Math.max(0, (session.ended_at - session.started_at) / 60000).toFixed(2);
  } else {
    session.duration_min = null;
  }
  return session;
}

// ---------------- Anthropic summarization (optional) ----------------
async function summarize(session, projectSlug) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const excerpt = session.excerpt.map((e) => `${e.role}: ${e.preview}`).join("\n");
  const tools = Object.entries(session.tool_calls)
    .map(([k, v]) => `${k}×${v.count}`)
    .join(", ");
  const body = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Summarize this coding session in 2-3 sentences. Mention the project, what shipped, and what's blocked/next.\n\nProject: ${projectSlug || "(general)"}\nDuration: ${session.duration_min} min\nMessages: ${session.message_count}\nTools used: ${tools || "(none)"}\n\nExcerpt:\n${excerpt}`,
      },
    ],
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn(`  summary failed: ${res.status} ${await res.text()}`);
    return null;
  }
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

// ---------------- Supabase upsert ----------------
async function supabaseRequest(method, pathOnUrl, body, prefer) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY required for writes");
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${url}/rest/v1/${pathOnUrl}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${method} ${pathOnUrl} failed: ${res.status} ${await res.text()}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${method} ${pathOnUrl} returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function upsertSession(filePath, session, projectSlug, summary) {
  const row = {
    external_id: filePath,
    project_slug: projectSlug,
    mode: "code",
    model: session.model,
    started_at: session.started_at?.toISOString() || new Date().toISOString(),
    ended_at: session.ended_at?.toISOString() || null,
    duration_min: session.duration_min,
    message_count: session.message_count,
    tokens_in: session.tokens_in,
    tokens_out: session.tokens_out,
    tokens_cache_read: session.tokens_cache_read,
    tokens_cache_write: session.tokens_cache_write,
    summary,
    tool_calls: session.tool_calls,
  };
  const [inserted] = await supabaseRequest(
    "POST",
    "sessions?on_conflict=external_id",
    [row],
    "resolution=merge-duplicates,return=representation"
  );
  return inserted.id;
}

async function replaceToolUsage(sessionId, projectSlug, toolCalls) {
  await supabaseRequest("DELETE", `tool_usage?session_id=eq.${sessionId}`, null);
  const rows = Object.entries(toolCalls).map(([name, v]) => ({
    session_id: sessionId,
    project_slug: projectSlug,
    tool_name: name,
    category: name.startsWith("mcp__") ? "mcp" : "tool",
    call_count: v.count,
    first_called_at: v.first?.toISOString?.() || null,
    last_called_at: v.last?.toISOString?.() || null,
  }));
  if (rows.length === 0) return;
  await supabaseRequest("POST", "tool_usage", rows);
}

async function recordIngesterRun(filesProcessed, lastFile) {
  await supabaseRequest(
    "POST",
    "ingester_state?on_conflict=id",
    [{ id: "sessions", last_run_at: new Date().toISOString(), last_file: lastFile, cursor: { files_processed: filesProcessed } }],
    "resolution=merge-duplicates"
  );
}

// ---------------- main ----------------
async function main() {
  await loadEnv();
  const args = parseArgs();

  const root = path.join(homedir(), ".claude", "projects");
  const knownSlugs = await loadKnownSlugs();
  console.log(`Loaded ${knownSlugs.length} known project slugs`);

  let files;
  if (args.file) {
    files = [args.file];
  } else {
    files = await findJsonl(root);
    if (args.since) {
      const filtered = [];
      for (const f of files) {
        const s = await stat(f);
        if (s.mtime >= args.since) filtered.push(f);
      }
      files = filtered;
    }
    // newest first
    const withStats = await Promise.all(files.map(async (f) => ({ f, mtime: (await stat(f)).mtime })));
    withStats.sort((a, b) => b.mtime - a.mtime);
    files = withStats.map((w) => w.f);
  }

  const targetCount = Math.min(files.length, args.limit);
  console.log(`Processing ${targetCount} of ${files.length} jsonl files${args.dryRun ? " (dry-run)" : ""}`);

  let okCount = 0;
  let lastFile = null;
  for (let i = 0; i < targetCount; i++) {
    const f = files[i];
    try {
      const raw = await readFile(f, "utf8");
      const lines = raw.split("\n");
      const session = parseSession(f, lines);
      const projectSlug = detectProject(f, knownSlugs);
      const tools = Object.keys(session.tool_calls).length;
      const startedStr = session.started_at?.toISOString().slice(0, 16) || "?";
      console.log(
        `[${i + 1}/${targetCount}] ${path.basename(path.dirname(f))}/${path.basename(f)} → ${projectSlug || "(none)"} | ${session.message_count} msgs, ${session.tokens_in + session.tokens_cache_read}↓/${session.tokens_out}↑ tk, ${tools} tools, ${startedStr}`
      );
      if (!args.dryRun) {
        const summary = await summarize(session, projectSlug);
        const sessionId = await upsertSession(f, session, projectSlug, summary);
        await replaceToolUsage(sessionId, projectSlug, session.tool_calls);
        okCount++;
        lastFile = f;
      }
    } catch (e) {
      console.error(`  ERROR on ${f}: ${e.message}`);
    }
  }

  if (!args.dryRun && okCount > 0) {
    await recordIngesterRun(okCount, lastFile);
  }
  console.log(`Done. ${okCount}/${targetCount} sessions ingested.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
