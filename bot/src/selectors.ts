/**
 * CSS/text selectors for the nycgovparks.org reservation flow.
 *
 * These are best-guess placeholders — I have not been able to load an
 * authenticated session against the real site, so the exact DOM structure is
 * unverified. Before this bot can book anything for real, run:
 *
 *   cd bot && npm run codegen
 *
 * which opens a real browser + Playwright Inspector. Log in and click
 * through one manual booking; the Inspector records the actual selectors
 * Playwright used. Copy the corrected values in here. See bot/README.md for
 * the full calibration walkthrough.
 */
export const URLS = {
  login: "https://www.nycgovparks.org/account/login", // VERIFY
  reservationHome: "https://www.nycgovparks.org/tennisreservation/", // VERIFIED (public URL)
};

export const SELECTORS = {
  // --- Login ---
  usernameInput: "#username", // VERIFY
  passwordInput: "#password", // VERIFY
  loginSubmit: "button[type=submit]", // VERIFY
  loggedInMarker: "text=Log Out", // VERIFY — any element only present once authenticated

  // --- Facility / date navigation ---
  facilityPicker: "#facility-select", // VERIFY
  dateNavNext: "[data-testid=next-day]", // VERIFY
  dateHeading: ".reservation-date-heading", // VERIFY

  // --- Slot grid ---
  // Expected to render one element per bookable slot; slotTimeLabel/slotBookButton
  // are scoped *within* a single slot row/card found via slotRow.
  slotRow: ".slot-row", // VERIFY
  slotTimeLabel: ".slot-time", // VERIFY
  slotDurationLabel: ".slot-duration", // VERIFY
  slotBookButton: "button.slot-book", // VERIFY

  // --- Checkout / confirmation ---
  checkoutConfirmButton: "#confirm-reservation", // VERIFY
  paymentSubmitButton: "#submit-payment", // VERIFY
  confirmationNumber: ".confirmation-number", // VERIFY
} as const;
