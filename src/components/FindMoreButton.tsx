import { useState } from "react";
import { useInvestors } from "../context/investors";
import { copyText } from "../lib/clipboard";
import { buildResearchPrompt } from "../lib/prompt";

/** Copies the research prompt (brief + type + endpoint + exclusions + examples) to the clipboard. */
export default function FindMoreButton() {
  const { status, investors } = useInvestors();
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const copy = async () => {
    const prompt = buildResearchPrompt(investors);
    const size = `${Math.round(prompt.text.length / 1024)} KB`;
    if (await copyText(prompt.text)) {
      setFeedback({
        text: prompt.hasToken
          ? `Prompt copiado: ${size}, ${prompt.examples} ejemplos, ${prompt.excluded} excluidos.`
          : `Prompt copiado sin token (${size}): definí VITE_INGEST_TOKEN.`,
        error: !prompt.hasToken,
      });
    } else {
      setFeedback({ text: "El navegador no permitió copiar al portapapeles.", error: true });
    }
    setTimeout(() => setFeedback(null), 6000);
  };

  return (
    <div className="header-actions">
      {feedback && <span className={`small ${feedback.error ? "error" : "muted"}`}>{feedback.text}</span>}
      <button type="button" className="primary" disabled={status !== "ready"} onClick={copy} title="Copia al portapapeles el prompt para buscar perfiles nuevos en un chat de IA">
        Buscar más perfiles
      </button>
    </div>
  );
}
