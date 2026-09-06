/** Pieces shared by the detail panels of both sections: linkified text, collapsible sections, lists, paragraphs. */
import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s)\]]+)/g;

export function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_RE).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part.replace(/[).,;]+$/, "")} target="_blank" rel="noreferrer">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function Section({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="muted">Sin datos.</p>;
  return (
    <ul className="simple-list">
      {items.map((item, i) => (
        <li key={i}>
          <Linkified text={item} />
        </li>
      ))}
    </ul>
  );
}

export function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n|\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i}>
            <Linkified text={p} />
          </p>
        ))}
    </>
  );
}
