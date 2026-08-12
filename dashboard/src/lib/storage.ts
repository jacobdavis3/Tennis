import { DEFAULT_CONFIG, DEFAULT_GITHUB_SETTINGS, type GithubSettings, type ReservationConfig } from "../types";

const KEYS = {
  settings: "tennis-bot.github-settings",
  config: "tennis-bot.config-cache",
};

export function loadSettings(): GithubSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? { ...DEFAULT_GITHUB_SETTINGS, ...JSON.parse(raw) } : DEFAULT_GITHUB_SETTINGS;
  } catch {
    return DEFAULT_GITHUB_SETTINGS;
  }
}

export function saveSettings(settings: GithubSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export function isConfigured(settings: GithubSettings): boolean {
  return Boolean(settings.token && settings.owner && settings.repo);
}

export function loadCachedConfig(): ReservationConfig {
  try {
    const raw = localStorage.getItem(KEYS.config);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveCachedConfig(config: ReservationConfig): void {
  localStorage.setItem(KEYS.config, JSON.stringify(config));
}
