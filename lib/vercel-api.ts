// Tiny Vercel REST client. Only the endpoints we need for sync.

const BASE = "https://api.vercel.com";

function headers() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN not set");
  return { Authorization: `Bearer ${token}` };
}

function teamQuery() {
  const t = process.env.VERCEL_TEAM_ID;
  return t ? `&teamId=${t}` : "";
}

export type VercelProject = {
  id: string;
  name: string;
  framework: string | null;
  latestDeployment?: VercelDeployment | null;
};

export type VercelDeployment = {
  uid?: string;
  id?: string;
  name?: string;
  url: string;
  createdAt: number;
  readyAt?: number | null;
  buildingAt?: number | null;
  readyState?: string;
  state?: string;
  meta?: { githubCommitSha?: string; githubCommitRef?: string };
  target?: string;
  errorMessage?: string | null;
};

export async function listVercelProjects(): Promise<VercelProject[]> {
  const out: VercelProject[] = [];
  let next: string | null = "";
  while (next !== null) {
    const cursor = next ? `&until=${next}` : "";
    const res = await fetch(`${BASE}/v9/projects?limit=100${teamQuery()}${cursor}`, {
      headers: headers(),
    });
    if (!res.ok) throw new Error(`vercel /projects ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { projects: VercelProject[]; pagination?: { next?: string | null } };
    out.push(...data.projects);
    next = data.pagination?.next ?? null;
  }
  return out;
}

export async function listProjectDeployments(projectId: string, limit = 5): Promise<VercelDeployment[]> {
  const res = await fetch(
    `${BASE}/v6/deployments?projectId=${projectId}&limit=${limit}&target=production${teamQuery()}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`vercel /deployments ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { deployments: VercelDeployment[] };
  return data.deployments;
}
