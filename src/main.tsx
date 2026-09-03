import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import InvestorsProvider from "./context/InvestorsProvider";
import { applyTheme, storedTheme } from "./lib/theme";
import "./index.css";

// Stamp the stored theme before the first paint so the page never flashes the wrong colours.
applyTheme(storedTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InvestorsProvider>
      <App />
    </InvestorsProvider>
  </StrictMode>,
);
