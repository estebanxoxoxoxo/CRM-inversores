/**
 * Input: where the profiles must be sent. The deployment URL comes from VITE_APP_URL (a chat outside this machine
 * cannot reach localhost), else the current origin; the token from VITE_INGEST_TOKEN.
 */
import { ingestToken } from "../../lib/api";

export { ingestToken };

/** Shown in place of the token when VITE_INGEST_TOKEN is not configured. */
const MISSING_TOKEN = "<VITE_INGEST_TOKEN no configurado>";

/** Shown in place of the deployment URL when VITE_APP_URL is not configured. */
const MISSING_APP_URL = "<VITE_APP_URL no configurado>";

/** Base URL of the deployment, or an empty string when it is not configured. */
export const appUrl = (): string => ((import.meta.env.VITE_APP_URL as string | undefined) ?? "").replace(/\/+$/, "");

/** Always the deployment, never the page's origin: the chat that receives the prompt cannot reach localhost. */
export function ingestEndpoint(): string {
  return `${appUrl() || MISSING_APP_URL}/api/investors`;
}

export const tokenOrPlaceholder = (token: string): string => token || MISSING_TOKEN;
