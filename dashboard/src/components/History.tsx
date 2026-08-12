import { useEffect, useState } from "react";
import type { GithubSettings, ReservationResult } from "../types";
import { getFile } from "../lib/github";

const HISTORY_PATH = "data/history.json";

interface Props {
  settings: GithubSettings;
}

export function History({ settings }: Props) {
  const [entries, setEntries] = useState<ReservationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const file = await getFile(settings, HISTORY_PATH);
      setEntries(file ? (JSON.parse(file.content) as ReservationResult[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.owner, settings.repo, settings.token]);

  return (
    <div className="card">
      <div className="row space-between">
        <h2>Booking history</h2>
        <button onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <p className="status-error">{error}</p>}
      {!error && entries.length === 0 && !loading && <p className="hint">No runs recorded yet.</p>}

      {entries.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Run at</th>
                <th>Target date</th>
                <th>Facility</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Confirmation / error</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td>{new Date(e.runAt).toLocaleString()}</td>
                  <td>{e.targetDate}</td>
                  <td>{e.facilityName}</td>
                  <td>{e.requestedTime}</td>
                  <td>{e.duration}m</td>
                  <td>{e.trigger}</td>
                  <td>
                    <span className={`badge badge-${e.status}`}>{e.status.replace(/_/g, " ")}</span>
                  </td>
                  <td>{e.confirmationNumber ?? e.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
