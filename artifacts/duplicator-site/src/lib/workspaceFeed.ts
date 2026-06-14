import { useEffect, useState } from "react";

export const WORKSPACE_TASKS_KEY = "duplicator-admin-tasks";
export const WORKSPACE_CALENDAR_KEY = "duplicator-calendar-events";
export const WORKSPACE_ANNOUNCEMENTS_KEY = "duplicator-announcements";
export const WORKSPACE_GALLERY_KEY = "duplicator-workspace-gallery";
export const WORKSPACE_RECOMMENDATIONS_KEY = "duplicator-workspace-recommendations";
export const WORKSPACE_MESSAGES_KEY = "duplicator-workspace-messages";
export const WORKSPACE_CUSTOMER_CARE_KEY = "duplicator-customer-care-contact";

export function useWorkspaceStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore storage read issues
    }
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage write issues
    }
  }, [key, value]);

  return [value, setValue] as const;
}
