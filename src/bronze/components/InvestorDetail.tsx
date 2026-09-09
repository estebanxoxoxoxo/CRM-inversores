import { useEffect, useState, type ReactNode } from "react";
import {
  BAND_CLASS,
  BAND_LABELS,
  CAP_LABELS,
  CONFIDENCE_LABELS,
  EMAIL_STATUS_LABELS,
  INVESTOR_TYPE_LABELS,
  RATING_LABELS,
  REGION_LABELS,
  SCORE_DIMENSION_LABELS,
  formatScore,
  scoreWeightLabel,
} from "../lib/labels";
import { SCORE_DIMENSIONS, SCORE_MAX, type Investor, type Score } from "../types/investor";
import { Badge } from "../../components/Badge";
import { RatingNote } from "../../components/RatingNote";
import { BulletList, Paragraphs, Section } from "../../components/DetailParts";
import ConnectionDialog from "./ConnectionDialog";
import { LevelBadge } from "./LevelBadge";
import RatingDialog from "./RatingDialog";

interface Props {
  investor: Investor | null;
  selectedId: string | null;
  onClose: () => void;
  /** Rendered among the badges: the other section's link to this investor, when it has one. */
  verdictBadge?: ReactNode;
}

function ScoreBreakdown({ score }: { score: Score }) {
  return (
    <div className="breakdown">
      {SCORE_DIMENSIONS.map((dimension) => (
        <div key={dimension} className="dimension" title={`Peso en el nivel: ${scoreWeightLabel(dimension)}`}>
          <span className="dimension-label">
            {SCORE_DIMENSION_LABELS[dimension]} <span className="dimension-weight">({scoreWeightLabel(dimension)})</span>
          </span>
          <span className="dimension-bar">
            <span className="dimension-fill" style={{ width: `${(100 * score[dimension]) / SCORE_MAX}%` }} />
          </span>
          <span className="dimension-value">
            {formatScore(score[dimension])}/{SCORE_MAX}
          </span>
        </div>
      ))}
      {score.caps.length > 0 && (
        <p className="muted small">
          Bruto {score.raw}. Topes aplicados: {score.caps.map((cap) => CAP_LABELS[cap]).join("; ")}.
        </p>
      )}
    </div>
  );
}

export default function InvestorDetail({ investor, selectedId, onClose, verdictBadge = null }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Escape closes the panel, unless a dialog (e.g. the rating dialog) is open: then it only closes the dialog.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!selectedId) return <section className="detail detail-empty">Elegí un inversor de la lista para ver la ficha completa.</section>;
  if (!investor) return <section className="detail error-notice">El perfil "{selectedId}" no está en la base.</section>;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(investor.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const { audit, contactSources } = investor;

  return (
    <section className="detail">
      <header className="detail-header">
        <LevelBadge level={investor.level} band={investor.band} large />
        <div className="detail-title">
          <h2>{investor.name}</h2>
          <p className="detail-subtitle">
            {investor.role} · <strong>{investor.firm}</strong> · {investor.baseCity}
          </p>
          <p className="detail-badges">
            {investor.rating && <Badge className={`rating-${investor.rating}`}>{RATING_LABELS[investor.rating]}</Badge>}
            {verdictBadge}
            <Badge className={BAND_CLASS[investor.band]}>{BAND_LABELS[investor.band]}</Badge>
            <Badge className={`confidence-${investor.confidence}`}>Fuentes: {CONFIDENCE_LABELS[investor.confidence]}</Badge>
            <Badge className="neutral">{REGION_LABELS[investor.region]}</Badge>
            <Badge className="neutral" title={investor.investorTypeDetail}>
              {INVESTOR_TYPE_LABELS[investor.investorType]}
            </Badge>
          </p>
        </div>
        <div className="detail-actions">
          <ConnectionDialog investor={investor} />
          <RatingDialog investor={investor} />
          <button type="button" className="close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
      </header>

      <RatingNote note={investor.ratingNote} />

      <div className="contact">
        {investor.linkedin ? (
          <a href={investor.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        ) : (
          <span className="muted">Sin LinkedIn público</span>
        )}
        {investor.personalWebsite && (
          <>
            <span className="separator">·</span>
            <a href={investor.personalWebsite} target="_blank" rel="noreferrer" title={investor.personalWebsite}>
              Web personal
            </a>
          </>
        )}
        <span className="separator">·</span>
        {investor.email ? (
          <>
            <a href={`mailto:${investor.email}`}>{investor.email}</a>
            <button type="button" className="mini" onClick={copyEmail}>
              {copied ? "copiado" : "copiar"}
            </button>
            <span className="muted"> {EMAIL_STATUS_LABELS[investor.emailStatus]}</span>
          </>
        ) : (
          <span className="muted">Email no encontrado</span>
        )}
      </div>

      <Section title={`Nivel ${investor.level}: motivo y desglose`}>
        <p>{audit.status === "pending" ? "Auditoría pendiente: este perfil todavía no fue revisado ni puntuado." : audit.reason}</p>
        <ScoreBreakdown score={audit.score} />
      </Section>
      <Section title="Por qué es interesante">
        <BulletList items={investor.whyInteresting} />
      </Section>
      <Section title="Tesis de inversión">
        <BulletList items={investor.investmentThesis} />
      </Section>
      <Section title="Etapa y ticket">
        <BulletList items={investor.stageAndTicket} />
      </Section>
      <Section title="Cómo llegar">
        <BulletList items={investor.howToReach} />
      </Section>
      <Section title="Riesgos y alertas">
        <BulletList items={investor.risksOrAlerts} />
      </Section>
      <Section title="Inversiones relevantes" open={false}>
        <BulletList items={investor.relevantInvestments} />
      </Section>
      <Section title="Señales de encaje" open={false}>
        <BulletList items={investor.fitSignals} />
      </Section>
      <Section title="Antecedentes" open={false}>
        <Paragraphs text={investor.background} />
      </Section>
      <Section title="Investigación larga" open={false}>
        <Paragraphs text={investor.deepResearch} />
      </Section>
      <Section title={`Fuentes (${investor.sources.length})`} open={false}>
        <BulletList items={investor.sources} />
      </Section>
      <Section title="Fuente de vías de contacto" open={false}>
        <h4 className="subheading">Email</h4>
        <BulletList items={contactSources.email} />
        <h4 className="subheading">LinkedIn</h4>
        <BulletList items={contactSources.linkedin.length ? contactSources.linkedin : [investor.linkedin ? "Perfil localizado y enlazado arriba." : "Sin LinkedIn público localizado."]} />
        <h4 className="subheading">Otras vías y perfiles</h4>
        <BulletList items={contactSources.other} />
      </Section>
      <p className="muted small detail-footer">Revisado el {audit.date}.</p>
    </section>
  );
}
