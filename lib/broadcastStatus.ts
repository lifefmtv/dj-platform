// Broadcast schedule — edit these constants to change on-air hours
const WEEKDAY_START = 18; // 6pm UK time
const WEEKDAY_END   = 24; // midnight UK time
const WEEKEND_START = 12; // noon UK time
const WEEKEND_END   = 24; // midnight UK time

const TZ = "Europe/London";

/**
 * Returns true if the current moment falls within LIFEFM.TV broadcast hours
 * based on UK time (Europe/London, handles GMT/BST automatically).
 *
 * Weekdays  — 18:00–00:00
 * Weekends  — 12:00–00:00
 */
export function isOnAir(now: Date = new Date()): boolean {
  // Extract the current hour and weekday in the London timezone.
  // Intl.DateTimeFormat is available in all modern environments (browser + Node).
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const hourStr    = parts.find((p) => p.type === "hour")?.value ?? "0";
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "";

  // formatToParts returns hour 0–23; midnight can come back as "24" on some
  // engines, so normalise it.
  const hour    = parseInt(hourStr, 10) % 24;
  const isWeekend = weekdayStr === "Sat" || weekdayStr === "Sun";

  const start = isWeekend ? WEEKEND_START : WEEKDAY_START;
  const end   = isWeekend ? WEEKEND_END   : WEEKDAY_END;

  // end === 24 means midnight — hour will be 0 at midnight, which is < start,
  // so the half-open interval [start, 24) correctly covers 18:00–23:59.
  return hour >= start && hour < end;
}
