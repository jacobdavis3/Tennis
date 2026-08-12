import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DEFAULT_CONFIG, type ReservationConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../../data/bot-config.json"); // repo-root/data/bot-config.json

export interface RunOverrides {
  facilityName?: string;
  facilityId?: string;
  date?: string; // explicit YYYY-MM-DD, bypasses daysInAdvance math
  time?: string; // HH:mm, overrides preferredTimes
  duration?: number;
}

export function loadConfig(): ReservationConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Reads workflow_dispatch input env vars, if this run was triggered manually. */
export function loadOverridesFromEnv(): RunOverrides {
  const overrides: RunOverrides = {};
  if (process.env.FACILITY_NAME_OVERRIDE) overrides.facilityName = process.env.FACILITY_NAME_OVERRIDE;
  if (process.env.FACILITY_ID_OVERRIDE) overrides.facilityId = process.env.FACILITY_ID_OVERRIDE;
  if (process.env.DATE_OVERRIDE) overrides.date = process.env.DATE_OVERRIDE;
  if (process.env.TIME_OVERRIDE) overrides.time = process.env.TIME_OVERRIDE;
  if (process.env.DURATION_OVERRIDE) overrides.duration = Number(process.env.DURATION_OVERRIDE);
  return overrides;
}
