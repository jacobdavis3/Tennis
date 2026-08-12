import type { Page } from "playwright";
import { SELECTORS, URLS } from "./selectors.js";

export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto(URLS.login, { waitUntil: "domcontentloaded" });
  await page.fill(SELECTORS.usernameInput, username);
  await page.fill(SELECTORS.passwordInput, password);
  await page.click(SELECTORS.loginSubmit);
  await page.waitForSelector(SELECTORS.loggedInMarker, { timeout: 15_000 });
}
