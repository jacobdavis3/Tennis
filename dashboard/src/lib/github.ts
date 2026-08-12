import type { GithubSettings } from "../types";

const API = "https://api.github.com";

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${body}`);
  }
}

export interface GithubFile {
  content: string;
  sha: string;
}

/** Fetches a file's decoded content + sha (sha is required to update it later). */
export async function getFile(settings: GithubSettings, path: string): Promise<GithubFile | null> {
  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}/contents/${path}?ref=${encodeURIComponent(settings.branch)}`,
    { headers: authHeaders(settings.token) }
  );
  if (res.status === 404) return null;
  await assertOk(res);
  const json = await res.json();
  return { content: fromBase64(json.content), sha: json.sha };
}

/** Creates or updates a file via the Contents API (i.e. commits it to the repo). */
export async function putFile(
  settings: GithubSettings,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const res = await fetch(`${API}/repos/${settings.owner}/${settings.repo}/contents/${path}`, {
    method: "PUT",
    headers: { ...authHeaders(settings.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch: settings.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  await assertOk(res);
}

/** Triggers the reservation workflow via workflow_dispatch with ad-hoc inputs. */
export async function dispatchWorkflow(settings: GithubSettings, inputs: Record<string, string>): Promise<void> {
  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}/actions/workflows/${settings.workflowFile}/dispatches`,
    {
      method: "POST",
      headers: { ...authHeaders(settings.token), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: settings.branch, inputs }),
    }
  );
  await assertOk(res);
}

export interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  event: string;
}

/** Lists the most recent runs of the reservation workflow, newest first. */
export async function listRecentRuns(settings: GithubSettings, perPage = 10): Promise<WorkflowRun[]> {
  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}/actions/workflows/${settings.workflowFile}/runs?per_page=${perPage}`,
    { headers: authHeaders(settings.token) }
  );
  await assertOk(res);
  const json = await res.json();
  return json.workflow_runs ?? [];
}

/** Verifies the token/owner/repo combination can actually reach the repo. */
export async function verifyAccess(settings: GithubSettings): Promise<void> {
  const res = await fetch(`${API}/repos/${settings.owner}/${settings.repo}`, {
    headers: authHeaders(settings.token),
  });
  await assertOk(res);
}
