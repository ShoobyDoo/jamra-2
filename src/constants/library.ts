import type { LibraryStats, LibraryStatus } from "../types";

export const LIBRARY_STATUS_LABELS: Record<LibraryStatus, string> = {
  reading: "Reading",
  completed: "Completed",
  plan_to_read: "Plan to Read",
  dropped: "Dropped",
  on_hold: "On Hold",
};

export const LIBRARY_STATUS_COLORS: Record<LibraryStatus, string> = {
  reading: "blue",
  completed: "green",
  plan_to_read: "gray",
  dropped: "red",
  on_hold: "yellow",
};

type LibraryStatsKey = keyof Pick<
  LibraryStats,
  "reading" | "completed" | "planToRead" | "dropped" | "onHold"
>;

export const LIBRARY_STATUS_STATS_KEY: Record<
  LibraryStatus,
  LibraryStatsKey
> = {
  reading: "reading",
  completed: "completed",
  plan_to_read: "planToRead",
  dropped: "dropped",
  on_hold: "onHold",
};

export const LIBRARY_STATUS_ORDER: LibraryStatus[] = [
  "reading",
  "completed",
  "plan_to_read",
  "on_hold",
  "dropped",
];

export const formatLibraryStatus = (status: LibraryStatus): string => {
  return LIBRARY_STATUS_LABELS[status] ?? status;
};
