import { IG_GRAPH_BASE } from "./constants";

type GraphError = { message?: string; type?: string; code?: number };

export type IgFetchInit = RequestInit & {
  searchParams?: Record<string, string>;
  /** When set, aborts after N ms. Omit for feed/carousel parity with main (no Graph timeout). */
  timeoutMs?: number;
};

export function isFetchTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || err.name === "TimeoutError";
}

export async function igFetch<T>(
  path: string,
  accessToken: string,
  init?: IgFetchInit,
): Promise<T> {
  const url = path.startsWith("http") ? new URL(path) : new URL(`${IG_GRAPH_BASE}/${path.replace(/^\//, "")}`);
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  url.searchParams.set("access_token", accessToken);

  const { searchParams: _searchParams, timeoutMs, ...restInit } = init ?? {};
  void _searchParams;
  const rest: RequestInit = { ...restInit };
  let signal = rest.signal;
  if (timeoutMs != null && timeoutMs > 0) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    signal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  }

  const res = await fetch(url.toString(), {
    ...rest,
    cache: "no-store",
    signal,
  });
  const body = (await res.json()) as T & { error?: GraphError };
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Instagram Graph API ${res.status}`);
  }
  return body;
}
