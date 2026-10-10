/** Shared HTTP constants for the insights route (testable without server-only). */
export const INSIGHTS_METHOD_NOT_ALLOWED_STATUS = 405 as const;

export function insightsMethodNotAllowedBody(): { error: string } {
  return { error: "Method not allowed" };
}
