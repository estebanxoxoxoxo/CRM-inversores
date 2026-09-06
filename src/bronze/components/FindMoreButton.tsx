import { useRef, useState, type FormEvent } from "react";
import { useInvestors } from "../context/investors";
import { copyText } from "../../lib/clipboard";
import { DEFAULT_COUNT, MAX_COUNT, buildResearchPrompt } from "../prompt-builder";

/** Asks how many new investors to look for, then copies the research prompt to the clipboard. */
export default function FindMoreButton() {
  const { status, investors } = useInvestors();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const open = () => {
    setCount("");
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    dialogRef.current?.close();
    const parsed = Number.parseInt(count, 10);
    const requested = Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, MAX_COUNT) : DEFAULT_COUNT;
    const prompt = buildResearchPrompt(investors, { count: requested });
    const size = `${Math.round(prompt.text.length / 1024)} KB`;
    if (await copyText(prompt.text)) {
      setFeedback({
        text: !prompt.hasToken
          ? `Prompt copiado sin token (${size}): definí VITE_INGEST_TOKEN.`
          : !prompt.hasEndpoint
            ? `Prompt copiado (${size}), pero sin endpoint: definí VITE_APP_URL con la URL del deploy para que el chat pueda enviar los perfiles.`
            : `Prompt copiado para ${requested} perfiles: ${size}, ${prompt.examples} ejemplos, ${prompt.excluded} excluidos.`,
        error: !prompt.hasToken || !prompt.hasEndpoint,
      });
    } else {
      setFeedback({ text: "El navegador no permitió copiar al portapapeles.", error: true });
    }
    setTimeout(() => setFeedback(null), 6000);
  };

  return (
    <>
      {feedback && <span className={`small ${feedback.error ? "error" : "muted"}`}>{feedback.text}</span>}
      <button type="button" className="primary" disabled={status !== "ready"} onClick={open} title="Copia al portapapeles el prompt para buscar perfiles nuevos en un chat de IA">
        Buscar más perfiles
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="find-more-title">
        <form onSubmit={submit}>
          <h3 id="find-more-title">Buscar más perfiles</h3>
          <p className="muted small">Se copia al portapapeles un prompt para pegar en un chat de IA, con los perfiles existentes como exclusiones y los mejores como ejemplos.</p>
          <label>
            Cantidad de perfiles a buscar
            <input ref={inputRef} type="number" min={1} max={MAX_COUNT} step={1} placeholder={String(DEFAULT_COUNT)} value={count} onChange={(e) => setCount(e.target.value)} />
            <span className="muted small">
              Se pide esa cantidad de perfiles nuevos, al máximo de pureza que se encuentre. Vacío: {DEFAULT_COUNT}.
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
