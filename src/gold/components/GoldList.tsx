import { aspectsFor, regionOf, type GoldEntry } from "../lib/filters";
import { LevelBadge } from "../../bronze/components/LevelBadge";
import { RATING_LABELS, REGION_SHORT_LABELS } from "../../bronze/lib/labels";
import type { Rating, Region } from "../../bronze/types/investor";
import { ConnectionChip } from "../../components/ConnectionChip";
import { ASPECT_LABELS, ASPECT_SHORT_LABELS } from "../lib/labels";

interface Props {
  entries: GoldEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The rating each profile inherits from the list it belongs to. Absent means the profile is in no rated list: no border. */
  ratingByInvestor: Map<string, Rating>;
}

const regionLabel = (region: string): string => REGION_SHORT_LABELS[region as Region] ?? region;

export default function GoldList({ entries, selectedId, onSelect, ratingByInvestor }: Props) {
  if (!entries.length) return <p className="empty">Ninguna evaluación coincide con los filtros.</p>;
  return (
    <ul className="list">
      {entries.map(({ evaluation, investor }) => {
        const rating = ratingByInvestor.get(evaluation.investorId);
        return (
          <li key={evaluation.investorId}>
            <button
              type="button"
              className={`card ${selectedId === evaluation.investorId ? "active" : ""} ${rating ? `rating-${rating}` : ""}`}
              title={rating ? `Calificación: ${RATING_LABELS[rating]}` : undefined}
              onClick={() => onSelect(evaluation.investorId)}
            >
            <div className="card-line1">
              <span className="card-line1-side">
                {investor && <LevelBadge level={investor.level} band={investor.band} />}
                <span className="card-name" title={evaluation.name}>
                  {evaluation.name}
                </span>
              </span>
              {investor && <ConnectionChip connectionAsked={investor.connectionAsked} />}
            </div>
            <div className="card-aspects">
              {aspectsFor(regionOf({ evaluation, investor })).map((key) => {
                const aspect = evaluation.aspects[key];
                if (!aspect) return null;
                return (
                  <span key={key} className={`aspect-chip ${aspect.passes ? "aspect-pass" : "aspect-fail"}`} title={`${ASPECT_LABELS[key]}: ${aspect.passes ? "pasa" : "no pasa"}`}>
                    {aspect.passes ? "✓" : "✗"} {ASPECT_SHORT_LABELS[key]}
                  </span>
                );
              })}
            </div>
            <div className="card-line2">
              {investor ? (
                <>
                  <span className="card-firm">{investor.firm}</span>
                  <span className="separator">·</span>
                  <span className="card-role" title={investor.role}>
                    {investor.role}
                  </span>
                </>
              ) : (
                <span className="muted">El perfil ya no está en la base</span>
              )}
            </div>
            <div className="card-line3">
              <span>{regionLabel(regionOf({ evaluation, investor }))}</span>
              {investor?.email && (
                <>
                  <span className="separator">·</span>
                  <span className="muted">{investor.emailStatus === "firm_general_mailbox" ? "buzón general" : "email"}</span>
                </>
              )}
              {evaluation.relatedFacts.length > 0 && (
                <>
                  <span className="separator">·</span>
                  <span className="muted">{evaluation.relatedFacts.length} hechos</span>
                </>
              )}
            </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
