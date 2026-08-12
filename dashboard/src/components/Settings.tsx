import { useState } from "react";
import type { GithubSettings } from "../types";
import { verifyAccess } from "../lib/github";

interface Props {
  settings: GithubSettings;
  onChange: (settings: GithubSettings) => void;
}

export function Settings({ settings, onChange }: Props) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function update<K extends keyof GithubSettings>(key: K, value: GithubSettings[K]) {
    onChange({ ...settings, [key]: value });
    setResult("idle");
  }

  async function testConnection() {
    setChecking(true);
    setResult("idle");
    try {
      await verifyAccess(settings);
      setResult("ok");
    } catch (err) {
      setResult("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="card">
      <h2>GitHub connection</h2>
      <p className="hint">
        The dashboard talks directly to the GitHub API from your browser to read/write repo files and trigger the
        bot workflow. Your token is stored only in this browser's local storage — it is never sent anywhere except
        api.github.com.
      </p>
      <label>
        Personal access token
        <input
          type="password"
          value={settings.token}
          onChange={(e) => update("token", e.target.value)}
          placeholder="github_pat_... (needs repo + workflow scopes)"
        />
      </label>
      <div className="row">
        <label>
          Repo owner
          <input value={settings.owner} onChange={(e) => update("owner", e.target.value)} placeholder="your-username" />
        </label>
        <label>
          Repo name
          <input value={settings.repo} onChange={(e) => update("repo", e.target.value)} placeholder="Tennis" />
        </label>
      </div>
      <div className="row">
        <label>
          Branch
          <input value={settings.branch} onChange={(e) => update("branch", e.target.value)} />
        </label>
        <label>
          Workflow file
          <input value={settings.workflowFile} onChange={(e) => update("workflowFile", e.target.value)} />
        </label>
      </div>
      <button onClick={testConnection} disabled={checking || !settings.token || !settings.owner || !settings.repo}>
        {checking ? "Checking…" : "Test connection"}
      </button>
      {result === "ok" && <p className="status-ok">Connected — the dashboard can reach this repo.</p>}
      {result === "error" && <p className="status-error">{errorMsg}</p>}
    </div>
  );
}
