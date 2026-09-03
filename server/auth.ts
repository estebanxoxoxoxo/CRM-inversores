/** Bearer-token check shared by the API functions. The token is VITE_INGEST_TOKEN. */
import { timingSafeEqual } from "node:crypto";

export const tokenConfigured = (): boolean => Boolean(process.env.VITE_INGEST_TOKEN);

export function isAuthorized(request: Request): boolean {
  const expected = process.env.VITE_INGEST_TOKEN ?? "";
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !presented) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  return a.length === b.length && timingSafeEqual(a, b);
}
