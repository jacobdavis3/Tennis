import { useEffect, useState } from "react";
import type { GithubSettings, ReservationConfig } from "../types";
import { getFile, putFile } from "../lib/github";
import { saveCachedConfig } from "../lib/storage";

const CONFIG_PATH = "data/bot-config.json";

interface Props {
  settings: GithubSettings;
  config: ReservationConfig;
  onChange: (config: ReservationConfig) => void;
}

export function ConfigForm({ settings, config, onChange }: Props) {
  const [sha, setSha] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFile(settings, CONFIG_PATH)
      .then((file) => {
        if (cancelled || !file) return;
        setSha(file.sha);
        const remote = JSON.parse(file.content) as ReservationConfig;
        onChange(remote);
        saveCachedConfig(remote);
      })
      .catch((err) => setMessage({ kind: "error", text: `Could not load remote config: ${err.message}` }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.owner, settings.repo, settings.token]);

  function update<K extends keyof ReservationConfig>(key: K, value: ReservationConfig[K]) {
    const next = { ...config, [key]: value };
    onChange(next);
    saveCachedConfig(next);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      await putFile(settings, CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "Update reservation config from dashboard", sha);
      const refreshed = await getFile(settings, CONFIG_PATH);
      if (refreshed) setSha(refreshed.sha);
      setMessage({ kind: "ok", text: "Saved — the scheduled bot will use this on its next run." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Recurring booking config</h2>
      <p className="hint">
        This is what the scheduled bot uses every run. It's committed to <code>{CONFIG_PATH}</code> in your repo, so
        it persists independent of any one browser.
      </p>
      {loading && <p className="hint">Loading current config from GitHub…</p>}

      <label>
        Facility name
        <input value={config.facilityName} onChange={(e) => update("facilityName", e.target.value)} placeholder="Prospect Park Tennis Center" />
      </label>
      <label>
        Facility ID
        <input value={config.facilityId} onChange={(e) => update("facilityId", e.target.value)} placeholder="requires selector calibration — see bot/README.md" />
      </label>
      <label>
        Preferred times (comma-separated, tried in order)
        <input
          value={config.preferredTimes.join(", ")}
          onChange={(e) => update("preferredTimes", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
          placeholder="09:00, 10:00, 08:00"
        />
      </label>
      <div className="row">
        <label>
          Duration (minutes)
          <select value={config.duration} onChange={(e) => update("duration", Number(e.target.value))}>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </select>
        </label>
        <label>
          Days in advance
          <input type="number" min={1} max={30} value={config.daysInAdvance} onChange={(e) => update("daysInAdvance", Number(e.target.value))} />
        </label>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={config.enabled} onChange={(e) => update("enabled", e.target.checked)} />
        Enable scheduled auto-booking
      </label>

      <button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save to GitHub"}
      </button>
      {message && <p className={message.kind === "ok" ? "status-ok" : "status-error"}>{message.text}</p>}
    </div>
  );
}
