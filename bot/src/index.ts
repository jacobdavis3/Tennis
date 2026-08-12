import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadConfig, loadOverridesFromEnv } from "./config.js";
import { login } from "./login.js";
import { attemptReservation } from "./reserve.js";
import { appendHistory } from "./history.js";
import type { ReservationResult } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = path.resolve(__dirname, "../artifacts");

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const config = loadConfig();
  const overrides = loadOverridesFromEnv();
  const trigger: ReservationResult["trigger"] = Object.keys(overrides).length > 0 ? "manual" : "schedule";

  const facilityName = overrides.facilityName ?? config.facilityName;
  const facilityId = overrides.facilityId ?? config.facilityId;
  const duration = overrides.duration ?? config.duration;
  const preferredTimes = overrides.time ? [overrides.time] : config.preferredTimes;
  const targetDate = overrides.date ?? addDays(new Date(), config.daysInAdvance);

  const baseResult = {
    runAt: new Date().toISOString(),
    targetDate,
    facilityName,
    requestedTime: preferredTimes[0] ?? "",
    duration,
    trigger,
  };

  if (trigger === "schedule" && !config.enabled) {
    appendHistory({ ...baseResult, status: "disabled" });
    console.log("Scheduled run skipped: bot is disabled in data/bot-config.json.");
    return;
  }

  if (!facilityId) {
    appendHistory({ ...baseResult, status: "failed", error: "No facilityId configured — run selector calibration first." });
    console.error("Missing facilityId. See bot/README.md 'Selector calibration'.");
    process.exitCode = 1;
    return;
  }

  const username = process.env.NYCGOVPARKS_USERNAME;
  const password = process.env.NYCGOVPARKS_PASSWORD;
  if (!username || !password) {
    throw new Error("NYCGOVPARKS_USERNAME / NYCGOVPARKS_PASSWORD env vars are required.");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await login(page, username, password);
    const outcome = await attemptReservation(page, { facilityId, targetDate, preferredTimes, duration });

    appendHistory({
      ...baseResult,
      requestedTime: outcome.matchedTime ?? baseResult.requestedTime,
      status: outcome.status,
      confirmationNumber: outcome.confirmationNumber,
      error: outcome.error,
    });

    if (outcome.status === "booked") {
      console.log(`Booked ${facilityName} on ${targetDate} at ${outcome.matchedTime} (confirmation: ${outcome.confirmationNumber}).`);
    } else if (outcome.status === "no_slot_available") {
      console.log(`No matching slot for ${facilityName} on ${targetDate}.`);
      process.exitCode = 1;
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("Reservation attempt failed:", error);

    if (!existsSync(ARTIFACTS_DIR)) mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "failure.png"), fullPage: true }).catch(() => {});

    appendHistory({ ...baseResult, status: "failed", error });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
