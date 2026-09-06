/**
 * Input: where the evaluations must be sent. The deployment URL comes from VITE_APP_URL (a chat outside this machine
 * cannot reach localhost), the token from VITE_INGEST_TOKEN; both through import.meta.env, like the research prompt.
 */
import { appUrl, ingestToken } from "../../../lib/api";

export { appUrl, ingestToken };

/** Shown in place of the token when VITE_INGEST_TOKEN is not configured. */
const MISSING_TOKEN = "<VITE_INGEST_TOKEN no configurado>";

/** Shown in place of the deployment URL when VITE_APP_URL is not configured. */
const MISSING_APP_URL = "<VITE_APP_URL no configurado>";

/** Always the deployment, never the page's origin: the chat that receives the prompt cannot reach localhost. */
export const ingestEndpoint = (): string => `${appUrl() || MISSING_APP_URL}/api/gold`;

export const tokenOrPlaceholder = (token: string): string => token || MISSING_TOKEN;
