import { BAND_CLASS, BAND_LABELS, CONFIDENCE_LABELS, CONNECTION_LABELS, INVESTOR_TYPE_LABELS, RATING_LABELS, REGION_SHORT_LABELS } from "../lib/labels";
import type { Investor } from "../types/investor";
import { Badge, LevelBadge } from "./Badges";

interface Props {
  investors: Investor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
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
            {investor.connectionAsked && <span className={`card-connection connection-${investor.connectionAsked}`}>{CONNECTION_LABELS[investor.connectionAsked]}</span>}
            <div className="card-line1">
              <LevelBadge level={investor.level} band={investor.band} />
              <span className="card-name">{investor.name}</span>
              <Badge className={BAND_CLASS[investor.band]}>{BAND_LABELS[investor.band]}</Badge>
              <Badge className={`confidence-${investor.confidence}`} title={`Confianza en las fuentes: ${CONFIDENCE_LABELS[investor.confidence]}`}>
                {CONFIDENCE_LABELS[investor.confidence]}
              </Badge>
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
