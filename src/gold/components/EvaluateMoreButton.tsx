import { useRef, useState, type FormEvent } from "react";
import { useGold } from "../context/gold";
import { useInvestors } from "../../bronze/context/investors";
import { DEFAULT_BATCH, MAX_BATCH, buildGoldPrompt, remainder } from "../prompt-builder";
import { copyText } from "../../lib/clipboard";

/** Asks how many investors go in the next batch, then copies the gold evaluation prompt to the clipboard. */
export default function EvaluateMoreButton() {
  const { status, investors } = useInvestors();
  const gold = useGold();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const ready = status === "ready" && gold.status === "ready";
  const pending = ready ? remainder(investors, gold.evaluations).length : 0;

  const open = () => {
    setCount("");
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    dialogRef.current?.close();
    const parsed = Number.parseInt(count, 10);
    const requested = Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, MAX_BATCH) : DEFAULT_BATCH;
    const prompt = buildGoldPrompt(investors, gold.evaluations, { count: requested });
    const size = `${Math.round(prompt.text.length / 1024)} KB`;
    if (await copyText(prompt.text)) {
      setFeedback({
        text: !prompt.hasToken
          ? `Prompt copiado sin token (${size}): definí VITE_INGEST_TOKEN.`
          : !prompt.hasEndpoint
            ? `Prompt copiado (${size}), pero sin endpoint: definí VITE_APP_URL con la URL del deploy para que el chat pueda enviar las evaluaciones.`
            : `Prompt copiado para ${prompt.batch} perfiles: ${size}, ${prompt.examples} ejemplos, ${prompt.excluded} excluidos; quedan ${prompt.remaining} sin evaluar.`,
        error: !prompt.hasToken || !prompt.hasEndpoint,
      });
    } else {
      setFeedback({ text: "El navegador no permitió copiar al portapapeles.", error: true });
    }
    setTimeout(() => setFeedback(null), 8000);
  };

  return (
    <>
      {feedback ? (
        <span className={`small ${feedback.error ? "error" : "muted"}`}>{feedback.text}</span>
      ) : ready && pending === 0 ? (
        <span className="small muted">No queda ningún perfil sin evaluar.</span>
      ) : null}
      <button type="button" className="primary" disabled={!ready || pending === 0} onClick={open} title="Copia al portapapeles el prompt para evaluar el próximo lote de perfiles en un chat de IA">
        Evaluar más perfiles
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="evaluate-more-title">
        <form onSubmit={submit}>
          <h3 id="evaluate-more-title">Evaluar más perfiles</h3>
          <p className="muted small">
            Se copia al portapapeles un prompt para pegar en un chat de IA, con los mejores perfiles sin evaluar como lote, los ya evaluados como exclusiones y los
            gold más recientes como ejemplos. {pending === 1 ? "Queda 1 perfil sin evaluar." : `Quedan ${pending} perfiles sin evaluar.`}
          </p>
          <label>
            Perfiles en el lote
            <input ref={inputRef} type="number" min={1} max={MAX_BATCH} step={1} placeholder={String(DEFAULT_BATCH)} value={count} onChange={(e) => setCount(e.target.value)} />
            <span className="muted small">
              Se toman por nivel, de mayor a menor, entre los que no tienen evaluación. Vacío: {DEFAULT_BATCH}; máximo {MAX_BATCH}, lo que acepta una petición.
            </span>
          </label>
          <div className="dialog-actions">
            <button type="button" className="link-button" onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="primary">
              Copiar prompt
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
