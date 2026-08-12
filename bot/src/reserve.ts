import type { Page } from "playwright";
import { SELECTORS, URLS } from "./selectors.js";

export interface AttemptParams {
  facilityId: string;
  targetDate: string; // YYYY-MM-DD
  preferredTimes: string[];
  duration: number;
}

export interface AttemptOutcome {
  status: "booked" | "no_slot_available" | "failed";
  confirmationNumber?: string;
  matchedTime?: string;
  error?: string;
}

/**
 * Navigates to the facility's reservation grid for targetDate and tries each
 * preferredTimes entry in order until one books successfully.
 *
 * NOTE: slot lookup/click logic below is written against the placeholder
 * selectors in ./selectors.ts and has not been run against the live site.
 * Calibrate selectors first (see bot/README.md) — this is the piece most
 * likely to need rework once real markup is known.
 */
export async function attemptReservation(page: Page, params: AttemptParams): Promise<AttemptOutcome> {
  const { facilityId, targetDate, preferredTimes, duration } = params;

  await page.goto(URLS.reservationHome, { waitUntil: "domcontentloaded" });
  await page.selectOption(SELECTORS.facilityPicker, facilityId);
  await navigateToDate(page, targetDate);

  for (const time of preferredTimes) {
    const slot = await findSlot(page, time, duration);
    if (!slot) continue;

    try {
      const bookButton = await slot.$(SELECTORS.slotBookButton);
      if (!bookButton) throw new Error("Book button not found within slot row");
      await bookButton.click();
      await page.click(SELECTORS.checkoutConfirmButton);
      await page.click(SELECTORS.paymentSubmitButton);
      const confEl = await page.waitForSelector(SELECTORS.confirmationNumber, { timeout: 20_000 });
      const confirmationNumber = (await confEl.textContent())?.trim();
      return { status: "booked", confirmationNumber, matchedTime: time };
    } catch (err) {
      // This slot vanished (someone else booked it) or checkout failed — try the next preferred time.
      continue;
    }
  }

  return { status: "no_slot_available" };
}

async function navigateToDate(page: Page, targetDate: string): Promise<void> {
  // Placeholder: click "next day" until the date heading matches targetDate.
  // Replace with a direct date-picker interaction once the real UI is known —
  // this loop is a reasonable fallback but slower and more failure-prone.
  for (let i = 0; i < 8; i++) {
    const heading = await page.textContent(SELECTORS.dateHeading).catch(() => null);
    if (heading?.includes(targetDate)) return;
    await page.click(SELECTORS.dateNavNext);
    await page.waitForTimeout(500);
  }
  throw new Error(`Could not navigate reservation grid to ${targetDate}`);
}

async function findSlot(page: Page, time: string, duration: number) {
  const rows = await page.$$(SELECTORS.slotRow);
  for (const row of rows) {
    const timeText = await row.$eval(SELECTORS.slotTimeLabel, (el) => el.textContent?.trim()).catch(() => null);
    const durationText = await row.$eval(SELECTORS.slotDurationLabel, (el) => el.textContent?.trim()).catch(() => null);
    if (timeText === time && durationText?.includes(String(duration))) {
      return row;
    }
  }
  return null;
}
