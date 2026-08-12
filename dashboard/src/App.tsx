import { useState } from "react";
import "./App.css";
import { Settings } from "./components/Settings";
import { ConfigForm } from "./components/ConfigForm";
import { TriggerPanel } from "./components/TriggerPanel";
import { History } from "./components/History";
import { loadSettings, saveSettings, loadCachedConfig, saveCachedConfig, isConfigured } from "./lib/storage";
import type { GithubSettings, ReservationConfig } from "./types";

type Tab = "config" | "trigger" | "history" | "settings";

function App() {
  const [settings, setSettingsState] = useState<GithubSettings>(loadSettings());
  const [config, setConfigState] = useState<ReservationConfig>(loadCachedConfig());
  const [tab, setTab] = useState<Tab>(isConfigured(loadSettings()) ? "config" : "settings");

  function setSettings(next: GithubSettings) {
    setSettingsState(next);
    saveSettings(next);
  }

  function setConfig(next: ReservationConfig) {
    setConfigState(next);
    saveCachedConfig(next);
  }

  const connected = isConfigured(settings);

  return (
    <div>
      <header className="app-header">
        <div>
          <h1>NYC Tennis Reservation Bot</h1>
          <p>Configure, trigger, and monitor your automated court booking.</p>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "config" ? "active" : ""} onClick={() => setTab("config")} disabled={!connected}>
          Config
        </button>
        <button className={tab === "trigger" ? "active" : ""} onClick={() => setTab("trigger")} disabled={!connected}>
          Trigger
        </button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")} disabled={!connected}>
          History
        </button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>
          Settings
        </button>
      </nav>

      {!connected && tab !== "settings" && (
        <div className="card">
          <p className="hint">Connect a GitHub token, owner, and repo under Settings first.</p>
        </div>
      )}

      {tab === "settings" && <Settings settings={settings} onChange={setSettings} />}
      {tab === "config" && connected && <ConfigForm settings={settings} config={config} onChange={setConfig} />}
      {tab === "trigger" && connected && <TriggerPanel settings={settings} config={config} />}
      {tab === "history" && connected && <History settings={settings} />}

      <p className="footer-note">
        Personal automation tool for your own NYC Parks account. Booking selectors need calibration before the bot
        can complete a real reservation — see bot/README.md.
      </p>
    </div>
  );
}

export default App;
