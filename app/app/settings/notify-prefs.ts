/** Notification preferences shape + parsing. Pure helpers (no "use server"). */

export interface NotifyPrefs {
  submission_updates: boolean;
  cf888_ready: boolean;
}

export const DEFAULT_NOTIFY_PREFS: NotifyPrefs = {
  submission_updates: true,
  cf888_ready: true,
};

export function parseNotifyPrefs(raw: string | null | undefined): NotifyPrefs {
  if (!raw) return { ...DEFAULT_NOTIFY_PREFS };
  try {
    const parsed = JSON.parse(raw) as Partial<NotifyPrefs>;
    return {
      submission_updates: parsed.submission_updates ?? DEFAULT_NOTIFY_PREFS.submission_updates,
      cf888_ready: parsed.cf888_ready ?? DEFAULT_NOTIFY_PREFS.cf888_ready,
    };
  } catch {
    return { ...DEFAULT_NOTIFY_PREFS };
  }
}
