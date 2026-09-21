/**
 * Fixed caveat shown on every profile, in both sections: two things the app never evaluates because they only
 * surface once a meeting happens. Same text everywhere, so it lives in one shared component.
 */
export const POST_MEETING_CAVEAT =
  "Conflictos de cartera y tolerancia a invertir en equipo que no habla inglés no se analiza. Es información que surge post reunión.";

export function PostMeetingCaveat() {
  return <p className="post-meeting-caveat muted small">{POST_MEETING_CAVEAT}</p>;
}
