import { useEffect, useState } from "react";
import type { GithubSettings, ReservationConfig } from "../types";
import { dispatchWorkflow, listRecentRuns, type WorkflowRun } from "../lib/github";

interface Props {
  settings: GithubSettings;
  config: ReservationConfig;
}

export function TriggerPanel({ settings, config }: Props) {
  const [facilityName, setFacilityName] = useState(config.facilityName);
  const [facilityId, setFacilityId] = useState(config.facilityId);
  const [date, setDate] = useState("");
  const [time, setTime] = useState(config.preferredTimes[0] ?? "");
  const [duration, setDuration] = useState(config.duration);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);

  useEffect(() => {
    setFacilityName(config.facilityName);
    setFacilityId(config.facilityId);
    setTime(config.preferredTimes[0] ?? "");
    setDuration(config.duration);
  }, [config]);

  async function refreshRuns() {
    try {
      setRuns(await listRecentRuns(settings, 5));
    } catch {
      // Non-fatal — the trigger button still works without this list.
    }
  }

  useEffect(() => {
    refreshRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.owner, settings.repo, settings.token]);

  async function triggerNow() {
    setTriggering(true);
    setMessage(null);
    try {
      const inputs: Record<string, string> = {};
      if (facilityName) inputs.facility_name = facilityName;
      if (facilityId) inputs.facility_id = facilityId;
      if (date) inputs.date = date;
      if (time) inputs.time = time;
      if (duration) inputs.duration = String(duration);

      await dispatchWorkflow(settings, inputs);
      setMessage({ kind: "ok", text: "Triggered. Check the Actions tab on GitHub (or the run list below in a few seconds)." });
      setTimeout(refreshRuns, 4000);
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="card">
      <h2>Run the bot now</h2>
      <p className="hint">One-off run — these values override the saved config for this run only.</p>
      <label>
        Facility name
        <input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} />
      </label>
      <label>
        Facility ID
        <input value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
      </label>
      <div className="row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label>
          Duration (min)
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </select>
        </label>
      </div>
      <button onClick={triggerNow} disabled={triggering}>
        {triggering ? "Triggering…" : "Run now"}
      </button>
      {message && <p className={message.kind === "ok" ? "status-ok" : "status-error"}>{message.text}</p>}

      <h3>Recent runs</h3>
      {runs.length === 0 && <p className="hint">No runs found yet.</p>}
      <ul className="run-list">
        {runs.map((run) => (
          <li key={run.id}>
            <a href={run.html_url} target="_blank" rel="noreferrer">
              {new Date(run.created_at).toLocaleString()} — {run.event}
            </a>
            <span className={`badge badge-${run.conclusion ?? run.status}`}>{run.conclusion ?? run.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
