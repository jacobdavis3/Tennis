export interface ReservationConfig {
  facilityName: string;
  facilityId: string;
  preferredTimes: string[];
  duration: number;
  daysInAdvance: number;
  enabled: boolean;
}

export interface ReservationResult {
  runAt: string;
  targetDate: string;
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

export interface GithubSettings {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  workflowFile: string;
}

export const DEFAULT_GITHUB_SETTINGS: GithubSettings = {
  token: "",
  owner: "",
  repo: "",
  branch: "main",
  workflowFile: "reserve.yml",
};
