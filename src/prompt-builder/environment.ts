/** Values that come from the browser environment: the deployment URL and the ingest token. */
import { MISSING_TOKEN } from "./config";

export function ingestEndpoint(): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;
  return `${base.replace(/\/+$/, "")}/api/investors`;
}

/** The configured token, or an empty string. */
export function ingestToken(): string {
  return (import.meta.env.VITE_INGEST_TOKEN as string | undefined) || "";
}

export function tokenOrPlaceholder(token: string): string {
  return token || MISSING_TOKEN;
}
