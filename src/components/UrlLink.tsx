/** The usual chain-link icon, drawn in the current text colour so it follows the theme. */
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/** A link icon that opens `url` in a new tab; `label` names what it opens, for screen readers and the tooltip. */
export function UrlLink({ url, label }: { url: string; label: string }) {
  return (
    <a className="url-link" href={url} target="_blank" rel="noreferrer" title={url} aria-label={`Abrir ${label}`}>
      <LinkIcon />
    </a>
  );
}
