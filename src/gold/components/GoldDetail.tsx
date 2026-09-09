import { useEffect, useState } from "react";
import { useSection } from "../../context/section";
import { copyText } from "../../lib/clipboard";
import { ASPECT_KEYS, aspectsFor, type GoldEntry } from "../lib/filters";
import { BAND_CLASS, BAND_LABELS, EMAIL_STATUS_LABELS, RATING_LABELS, REGION_LABELS } from "../../bronze/lib/labels";
import { ASPECT_LABELS, VERDICT_LABELS } from "../lib/labels";
import type { Region } from "../../bronze/types/investor";
import ConnectionDialog from "../../bronze/components/ConnectionDialog";
import { LevelBadge } from "../../bronze/components/LevelBadge";
import RatingDialog from "../../bronze/components/RatingDialog";
import { Badge } from "../../components/Badge";
import { RatingNote } from "../../components/RatingNote";
import { Linkified, Section } from "../../components/DetailParts";

interface Props {
  entry: GoldEntry | null;
  selectedId: string | null;
  onClose: () => void;
}

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" });
};

export default function GoldDetail({ entry, selectedId, onClose }: Props) {
  const { go } = useSection();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Escape closes the panel, unless a dialog is open: then it only closes the dialog.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!selectedId) return <section className="detail detail-empty">Elegí un perfil de la lista para ver su evaluación.</section>;
  if (!entry) {
    return (
      <section className="detail">
        <header className="detail-header">
          <div className="detail-title">
            <h2>Sin evaluación</h2>
            <p className="detail-subtitle">El perfil "{selectedId}" todavía no tiene documento en gold: entra en el próximo lote.</p>
          </div>
          <div className="detail-actions">
            <button type="button" className="secondary" onClick={() => go("bronze", selectedId)}>
              Ver en Bronce
            </button>
            <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          </div>
        </header>
      </section>
    );
  }

  const { evaluation, investor } = entry;

  const copy = async (key: string, text: string) => {
    if (await copyText(text)) {
      setCopied(key);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
    }
  };

  return (
    <section className="detail">
      <header className="detail-header">
        {investor && <LevelBadge level={investor.level} band={investor.band} large />}
        <div className="detail-title">
          <h2>{evaluation.name}</h2>
          {investor ? (
            <p className="detail-subtitle">
              {investor.role} · <strong>{investor.firm}</strong> · {investor.baseCity}
            </p>
          ) : (
            <p className="detail-subtitle muted">El perfil ya no está en la colección investors.</p>
          )}
          <p className="detail-badges">
            {investor?.rating && <Badge className={`rating-${investor.rating}`}>{RATING_LABELS[investor.rating]}</Badge>}
            <Badge className={`verdict-${evaluation.verdict}`}>{VERDICT_LABELS[evaluation.verdict]}</Badge>
            {investor && <Badge className={BAND_CLASS[investor.band]}>{BAND_LABELS[investor.band]}</Badge>}
            <Badge className="neutral">{REGION_LABELS[evaluation.region as Region] ?? evaluation.region}</Badge>
          </p>
        </div>
        <div className="detail-actions">
          {investor && (
            <>
              <ConnectionDialog investor={investor} />
              <RatingDialog investor={investor} />
              <button type="button" className="secondary" onClick={() => go("bronze", investor.id)} title="Abrir la ficha completa del inversor">
                Ficha en Bronce
              </button>
            </>
          )}
          <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
      </header>

      <RatingNote note={investor?.ratingNote ?? null} />

      {investor && (
        <div className="contact">
          {investor.linkedin ? (
            <a href={investor.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          ) : (
            <span className="muted">Sin LinkedIn público</span>
          )}
          <span className="separator">·</span>
          {investor.email ? (
            <>
              <a href={`mailto:${investor.email}`}>{investor.email}</a>
              <button type="button" className="mini" onClick={() => copy("email", investor.email)}>
                {copied === "email" ? "copiado" : "copiar"}
              </button>
              <span className="muted"> {EMAIL_STATUS_LABELS[investor.emailStatus]}</span>
            </>
          ) : (
            <span className="muted">Email no encontrado</span>
          )}
        </div>
      )}

      <Section title={aspectsFor(evaluation.region).length === ASPECT_KEYS.length ? "Los cuatro aspectos" : "Los dos aspectos"}>
        <ul className="aspects">
          {aspectsFor(evaluation.region).map((key) => {
            const aspect = evaluation.aspects[key];
            const state = aspect === null ? "aspect-na" : aspect.passes ? "aspect-pass" : "aspect-fail";
            return (
              <li key={key} className={`aspect ${state}`}>
                <span className="aspect-mark" aria-hidden="true">
                  {aspect === null ? "–" : aspect.passes ? "✓" : "✗"}
                </span>
                <div className="aspect-body">
                  <strong>{ASPECT_LABELS[key]}</strong>{" "}
                  <span className="muted small">{aspect === null ? "no aplica: sólo para EE. UU." : aspect.passes ? "pasa" : "no pasa"}</span>
                  {aspect && (
                    <p>
                      <Linkified text={aspect.reason} />
                    </p>
                  )}
                  {aspect && aspect.sources.length > 0 && (
                    <ul className="aspect-sources">
                      {aspect.sources.map((source) => (
                        <li key={source}>
                          <a href={source} target="_blank" rel="noreferrer">
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {evaluation.verdict === "gold" ? (
        <Section title={`Mails propuestos (${evaluation.emails.length})`}>
          <div className="emails">
            {evaluation.emails.map((email, i) => (
              <article key={i} className="email">
                <header className="email-header">
                  <h4 className="email-subject">{email.subject}</h4>
                  <span className="email-actions">
                    <button type="button" className="mini" onClick={() => copy(`subject-${i}`, email.subject)}>
                      {copied === `subject-${i}` ? "copiado" : "copiar asunto"}
                    </button>
                    <button type="button" className="mini" onClick={() => copy(`body-${i}`, email.body)}>
                      {copied === `body-${i}` ? "copiado" : "copiar cuerpo"}
                    </button>
                  </span>
                </header>
                <p className="muted small email-based">Basado en: {email.basedOn}</p>
                <pre className="email-body">{email.body}</pre>
              </article>
            ))}
          </div>
        </Section>
      ) : (
        <Section title="Mails propuestos">
          <p className="muted">Sin mails: el veredicto es rechazado.</p>
        </Section>
      )}
      <p className="muted small detail-footer">Evaluado el {formatDate(evaluation.evaluatedAt)}.</p>
    </section>
  );
}
