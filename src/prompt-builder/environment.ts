/** Values that come from the browser environment: the deployment URL and the ingest token. */
import { ingestToken } from "../lib/api";
import { MISSING_TOKEN } from "./config";

export { ingestToken };

export function ingestEndpoint(): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;
  return `${base.replace(/\/+$/, "")}/api/investors`;
}

export function tokenOrPlaceholder(token: string): string {
  return token || MISSING_TOKEN;
}
