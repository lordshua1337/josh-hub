// Supabase Management API client — bypass for the flaky MCP.
// Uses SUPABASE_MANAGEMENT_TOKEN (PAT) to apply DDL and run arbitrary SQL.
// Auth: Bearer <PAT> against https://api.supabase.com/v1/projects/{ref}/...

import "server-only";

const BASE = "https://api.supabase.com/v1";

function pat(): string {
  const t = process.env.SUPABASE_MANAGEMENT_TOKEN;
  if (!t) throw new Error("SUPABASE_MANAGEMENT_TOKEN not set");
  return t;
}
function projectRef(): string {
  const r = process.env.SUPABASE_PROJECT_REF;
  if (!r) throw new Error("SUPABASE_PROJECT_REF not set");
  return r;
}

export async function runSql<T = unknown>(query: string): Promise<T> {
  const res = await fetch(`${BASE}/projects/${projectRef()}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Supabase Management API ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

export async function applyMigration(sql: string): Promise<unknown> {
  return runSql(sql);
}
