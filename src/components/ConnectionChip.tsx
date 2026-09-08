import { CONNECTION_LABELS } from "../bronze/lib/labels";
import type { ConnectionAsked } from "../bronze/types/investor";

/** LinkedIn glyph: connections are asked and accepted there. Inherits the chip's colour. */
function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
      <circle cx="4.98" cy="5" r="2.5" />
      <rect x="2.4" y="9.5" width="5.16" height="11.5" rx="0.5" />
      <path d="M9.9 9.5h4.95v1.57h.07c.69-1.24 2.38-2.05 3.9-2.05 4.17 0 4.94 2.6 4.94 5.98V21h-5.16v-4.95c0-1.18-.02-2.7-1.7-2.7-1.7 0-1.96 1.29-1.96 2.62V21H9.9V9.5z" />
    </svg>
  );
}

/**
 * Connection state, centred in the card's first row. Shared by both sections on purpose: the state lives in the
 * investor, so the same profile has to look the same wherever it is listed.
 */
export function ConnectionChip({ connectionAsked }: { connectionAsked: ConnectionAsked }) {
  if (!connectionAsked) return null;
  return (
    <span className={`card-connection connection-${connectionAsked}`}>
      <LinkedinIcon />
      {CONNECTION_LABELS[connectionAsked]}
    </span>
  );
}
