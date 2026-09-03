/**
 * Input: where the profiles must be sent. The deployment URL comes from VITE_APP_URL (a chat outside this machine
 * cannot reach localhost), else the current origin; the token from VITE_INGEST_TOKEN.
 */
import { ingestToken } from "../../lib/api";

export { ingestToken };

/** Shown in place of the token when VITE_INGEST_TOKEN is not configured. */
export const MISSING_TOKEN = "<VITE_INGEST_TOKEN no configurado>";

export function ingestEndpoint(): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;
  return `${base.replace(/\/+$/, "")}/api/investors`;
}

export const tokenOrPlaceholder = (token: string): string => token || MISSING_TOKEN;
