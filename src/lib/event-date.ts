// All event times are displayed in the event's local timezone (US Pacific).
// This ensures a 3 PM PST event shows as 3 PM for everyone, regardless of viewer timezone.

const EVENT_TZ = "America/Los_Angeles";

export function formatEventDate(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    timeZone: EVENT_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatEventTime(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", {
    timeZone: EVENT_TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventTimeRange(start: string, end?: string): string {
  const startTime = formatEventTime(start);
  if (!end) return startTime;

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.toLocaleDateString("en-US", { timeZone: EVENT_TZ }) !== endDate.toLocaleDateString("en-US", { timeZone: EVENT_TZ })) {
    return "Multi-day event";
  }

  return `${startTime} - ${formatEventTime(end)}`;
}

export function formatEventDateShort(dateString: string): { month: string; day: string; year: string } {
  if (!dateString) return { month: "", day: "", year: "" };
  const date = new Date(dateString);
  return {
    month: date.toLocaleString("en-US", { timeZone: EVENT_TZ, month: "short" }),
    day: date.toLocaleString("en-US", { timeZone: EVENT_TZ, day: "numeric" }),
    year: date.toLocaleString("en-US", { timeZone: EVENT_TZ, year: "numeric" }),
  };
}
