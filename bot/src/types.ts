export interface ReservationConfig {
  /** Human-readable facility name, e.g. "Prospect Park Tennis Center" */
  facilityName: string;
  /**
   * Site-specific facility identifier used to build the reservation URL / select
   * the facility in the booking UI. Placeholder until calibrated — see
   * bot/README.md "Selector calibration".
   */
  facilityId: string;
  /** Ordered list of preferred start times in 24h "HH:mm", tried in order. */
  preferredTimes: string[];
  /** Slot duration in minutes, e.g. 30 or 60. */
  duration: number;
  /** How many days ahead the booking window opens (NYC Parks: 7). */
  daysInAdvance: number;
  /** Whether the scheduled (cron) run should attempt a booking at all. */
  enabled: boolean;
}

export interface ReservationResult {
  runAt: string; // ISO timestamp
  targetDate: string; // YYYY-MM-DD
  facilityName: string;
  requestedTime: string;
  duration: number;
  status: "booked" | "no_slot_available" | "failed" | "disabled";
  confirmationNumber?: string;
  error?: string;
  trigger: "schedule" | "manual";
}

export const DEFAULT_CONFIG: ReservationConfig = {
  facilityName: "",
  facilityId: "",
  preferredTimes: ["09:00"],
  duration: 60,
  daysInAdvance: 7,
  enabled: false,
};
