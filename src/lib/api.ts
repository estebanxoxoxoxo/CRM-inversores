/** Calls from the app to its own API functions (api/*.ts), on the origin the app is served from. */

export const ingestToken = (): string => (import.meta.env.VITE_INGEST_TOKEN as string | undefined) || "";

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Fetches JSON from the app's API; throws ApiError with the server's message when the response is not ok. */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${window.location.origin}${path}`, init);
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new ApiError(response.status, body.error || `${response.status} ${response.statusText}`);
  return body;
}

export const authorizedInit = (init: RequestInit = {}): RequestInit => ({ ...init, headers: { ...init.headers, authorization: `Bearer ${ingestToken()}` } });
