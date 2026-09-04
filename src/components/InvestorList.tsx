import { BAND_CLASS, BAND_LABELS, CONFIDENCE_LABELS, CONNECTION_LABELS, INVESTOR_TYPE_LABELS, RATING_LABELS, REGION_SHORT_LABELS } from "../lib/labels";
import type { Investor } from "../types/investor";
import { Badge, LevelBadge } from "./Badges";

interface Props {
  investors: Investor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

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

export default function InvestorList({ investors, selectedId, onSelect }: Props) {
  if (!investors.length) return <p className="empty">Ningún perfil coincide con los filtros.</p>;
  return (
    <ul className="list">
      {investors.map((investor) => (
        <li key={investor.id}>
          <button
            type="button"
            className={`card ${selectedId === investor.id ? "active" : ""} ${investor.rating ? `rating-${investor.rating}` : ""}`}
            title={investor.rating ? `Calificación: ${RATING_LABELS[investor.rating]}` : undefined}
            onClick={() => onSelect(investor.id)}
          >
            <div className="card-line1">
              <span className="card-line1-side">
                <LevelBadge level={investor.level} band={investor.band} />
                <span className="card-name" title={investor.name}>
                  {investor.name}
                </span>
              </span>
              {investor.connectionAsked && (
                <span className={`card-connection connection-${investor.connectionAsked}`}>
                  <LinkedinIcon />
                  {CONNECTION_LABELS[investor.connectionAsked]}
                </span>
              )}
              <span className="card-line1-side card-line1-badges">
                <Badge className={BAND_CLASS[investor.band]}>{BAND_LABELS[investor.band]}</Badge>
                <Badge className={`confidence-${investor.confidence}`} title={`Confianza en las fuentes: ${CONFIDENCE_LABELS[investor.confidence]}`}>
                  {CONFIDENCE_LABELS[investor.confidence]}
                </Badge>
              </span>
            </div>
            <div className="card-line2">
              <span className="card-firm">{investor.firm}</span>
              <span className="separator">·</span>
              <span className="card-role" title={investor.role}>
                {investor.role}
              </span>
            </div>
            <div className="card-line3">
              <span>{REGION_SHORT_LABELS[investor.region]}</span>
              <span className="separator">·</span>
              <span>{INVESTOR_TYPE_LABELS[investor.investorType]}</span>
              {investor.email && (
                <>
                  <span className="separator">·</span>
                  <span className="muted">{investor.emailStatus === "firm_general_mailbox" ? "buzón general" : "email"}</span>
                </>
              )}
              {investor.linkedin && (
                <>
                  <span className="separator">·</span>
                  <span className="muted">LinkedIn</span>
                </>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
