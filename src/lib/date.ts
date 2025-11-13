const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const RELATIVE_TIME_STEPS: Array<{
  unit: Intl.RelativeTimeFormatUnit;
  ms: number;
}> = [
  { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: "day", ms: 1000 * 60 * 60 * 24 },
  { unit: "hour", ms: 1000 * 60 * 60 },
  { unit: "minute", ms: 1000 * 60 },
  { unit: "second", ms: 1000 },
];

export const formatRelativeTime = (value?: string | number | Date): string => {
  if (!value) {
    return "just now";
  }

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return "just now";
  }

  const diffMs = target.getTime() - Date.now();

  for (const step of RELATIVE_TIME_STEPS) {
    if (Math.abs(diffMs) >= step.ms || step.unit === "second") {
      const delta = Math.round(diffMs / step.ms);
      return relativeTimeFormatter.format(delta, step.unit);
    }
  }

  return "just now";
};
