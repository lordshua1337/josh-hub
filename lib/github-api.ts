// Tiny GitHub REST helper for the commit sync.

const BASE = "https://api.github.com";

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export type GhCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  stats?: { additions: number; deletions: number };
};

/**
 * Returns the {owner, repo} from a GitHub URL or null if non-parseable.
 */
export function parseRepoUrl(url: string | null): { owner: string; repo: string } | null {
  if (!url) return null;
  const m = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

export async function listCommits(
  owner: string,
  repo: string,
  opts: { since?: string; per_page?: number } = {}
): Promise<GhCommit[]> {
  const params = new URLSearchParams();
  if (opts.since) params.set("since", opts.since);
  params.set("per_page", String(opts.per_page ?? 30));
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/commits?${params}`, { headers: headers() });
  if (res.status === 404 || res.status === 409) return []; // empty repo or not found
  if (!res.ok) {
    throw new Error(`gh /commits ${owner}/${repo} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return (await res.json()) as GhCommit[];
}
