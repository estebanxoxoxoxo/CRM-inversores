/**
 * Input: where the evaluations must be sent. The deployment URL comes from VITE_APP_URL (a chat outside this machine
 * cannot reach localhost), the token from VITE_INGEST_TOKEN. Both are read from process.env after dotenv.
 */

/** Shown in place of the token when VITE_INGEST_TOKEN is not configured. */
export const MISSING_TOKEN = "<VITE_INGEST_TOKEN no configurado>";

/** Shown in place of the deployment URL when VITE_APP_URL is not configured. */
export const MISSING_APP_URL = "<VITE_APP_URL no configurado>";

/** Base URL of the deployment without trailing slashes, or an empty string when it is not configured. */
export const appUrl = (): string => (process.env.VITE_APP_URL ?? "").replace(/\/+$/, "");

export const ingestToken = (): string => process.env.VITE_INGEST_TOKEN ?? "";

export const ingestEndpoint = (): string => `${appUrl() || MISSING_APP_URL}/api/gold`;

export const tokenOrPlaceholder = (token: string): string => token || MISSING_TOKEN;
