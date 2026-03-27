// ============================================================
// DEADLINE REMINDER STORE
// Persists per-deadline reminder state in localStorage.
// Supports: set, dismiss, snooze, clear.
// ============================================================

const REMINDERS_KEY = "rr-deadline-reminders";

export interface DeadlineReminder {
  deadlineId: string;
  /** When reminder was set */
  setAt: string;
  /** If snoozed, don't show before this ISO date */
  snoozedUntil: string | null;
  /** True once user has dismissed permanently */
  dismissed: boolean;
  /** User note about this reminder */
  note: string;
}

// ─── STORAGE ────────────────────────────────────────────────

function load(): DeadlineReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as DeadlineReminder[]) : [];
  } catch {
    return [];
  }
}

function save(reminders: DeadlineReminder[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// ─── PUBLIC API ─────────────────────────────────────────────

/** Return all reminders (including dismissed/snoozed). */
export function getAllReminders(): DeadlineReminder[] {
  return load();
}

/** Return a single reminder for a deadline, or undefined. */
export function getReminder(deadlineId: string): DeadlineReminder | undefined {
  return load().find((r) => r.deadlineId === deadlineId);
}

/** Return count of active (not dismissed, not currently snoozed) reminders. */
export function getActiveReminderCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  return load().filter(
    (r) =>
      !r.dismissed &&
      (r.snoozedUntil === null || r.snoozedUntil <= today)
  ).length;
}

/** Whether a deadline has an active reminder right now. */
export function isReminderActive(deadlineId: string): boolean {
  const r = getReminder(deadlineId);
  if (!r || r.dismissed) return false;
  const today = new Date().toISOString().slice(0, 10);
  return r.snoozedUntil === null || r.snoozedUntil <= today;
}

/** Set a reminder for a deadline (creates or overwrites). */
export function setReminder(deadlineId: string, note = ""): DeadlineReminder {
  const all = load();
  const idx = all.findIndex((r) => r.deadlineId === deadlineId);
  const reminder: DeadlineReminder = {
    deadlineId,
    setAt: new Date().toISOString(),
    snoozedUntil: null,
    dismissed: false,
    note,
  };
  if (idx === -1) {
    all.push(reminder);
  } else {
    all[idx] = reminder;
  }
  save(all);
  return reminder;
}

/** Snooze a reminder until the given YYYY-MM-DD date. */
export function snoozeReminder(deadlineId: string, untilDate: string): void {
  const all = load();
  const idx = all.findIndex((r) => r.deadlineId === deadlineId);
  if (idx === -1) {
    // Create snoozed reminder
    all.push({
      deadlineId,
      setAt: new Date().toISOString(),
      snoozedUntil: untilDate,
      dismissed: false,
      note: "",
    });
  } else {
    all[idx] = { ...all[idx], snoozedUntil: untilDate, dismissed: false };
  }
  save(all);
}

/** Permanently dismiss a reminder. */
export function dismissReminder(deadlineId: string): void {
  const all = load();
  const idx = all.findIndex((r) => r.deadlineId === deadlineId);
  if (idx === -1) {
    all.push({
      deadlineId,
      setAt: new Date().toISOString(),
      snoozedUntil: null,
      dismissed: true,
      note: "",
    });
  } else {
    all[idx] = { ...all[idx], dismissed: true };
  }
  save(all);
}

/** Clear a reminder entirely (un-set). */
export function clearReminder(deadlineId: string): void {
  const all = load().filter((r) => r.deadlineId !== deadlineId);
  save(all);
}
