import { useRef } from "react";

/** The usual chain-link icon, drawn in the current text colour so it follows the theme. */
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/**
 * A link icon for a set of sources. One source: the icon is the link itself and opens it in a new tab. Several: the
 * icon opens a popup listing every link. None: nothing renders.
 */
export function SourcesLink({ sources, title }: { sources: string[]; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  if (!sources.length) return null;
  if (sources.length === 1) {
    return (
      <a className="source-link" href={sources[0]} target="_blank" rel="noreferrer" title={sources[0]} aria-label={`Abrir la fuente de ${title}`}>
        <LinkIcon />
      </a>
    );
  }
  return (
    <>
      <button type="button" className="source-link" title={`${sources.length} fuentes`} aria-label={`Ver las ${sources.length} fuentes de ${title}`} onClick={() => dialogRef.current?.showModal()}>
        <LinkIcon />
        <span className="source-count">{sources.length}</span>
      </button>
      <dialog ref={dialogRef} className="dialog sources-dialog" aria-label={`Fuentes de ${title}`}>
        <h3>Fuentes de {title}</h3>
        <ul className="sources-list">
          {sources.map((source) => (
            <li key={source}>
              <a href={source} target="_blank" rel="noreferrer">
                {source}
              </a>
            </li>
          ))}
        </ul>
        <div className="dialog-actions">
          <button type="button" className="link-button" onClick={() => dialogRef.current?.close()}>
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
