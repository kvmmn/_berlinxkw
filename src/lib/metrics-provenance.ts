import type { MetricsSource, Week } from "./types";

/** Weeks without an explicit live source are treated as demo seed data. */
export function getWeekMetricsSource(week: Week): MetricsSource {
  return week.metricsSource ?? "demo";
}

export function metricsSourceLabel(source: MetricsSource): {
  en: string;
  fa: string;
  badgeClass: "demo" | "manual" | "import" | "meta";
} {
  switch (source) {
    case "manual":
      return {
        en: "live (manual)",
        fa: "زنده (دستی)",
        badgeClass: "manual",
      };
    case "import":
      return {
        en: "live (import)",
        fa: "زنده (واردات)",
        badgeClass: "import",
      };
    case "meta":
      return {
        en: "live (Meta)",
        fa: "زنده (متا)",
        badgeClass: "meta",
      };
    default:
      return {
        en: "demo seed",
        fa: "دمو (seed)",
        badgeClass: "demo",
      };
  }
}

export function isLiveMetricsSource(source: MetricsSource): boolean {
  return source === "manual" || source === "import" || source === "meta";
}
