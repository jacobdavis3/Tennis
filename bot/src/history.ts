import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { ReservationResult } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const MAX_ENTRIES = 200;

export function appendHistory(result: ReservationResult): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  let history: ReservationResult[] = [];
  if (existsSync(HISTORY_PATH)) {
    try {
      history = JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
    } catch {
      history = [];
    }
  }

  history.unshift(result); // newest first, matches dashboard's expected order
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;

  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + "\n");
}
