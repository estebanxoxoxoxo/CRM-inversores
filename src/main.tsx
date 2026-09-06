import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import BackupProvider from "./context/BackupProvider";
import GoldProvider from "./gold/context/GoldProvider";
import InvestorsProvider from "./bronze/context/InvestorsProvider";
import { applyTheme, storedTheme } from "./lib/theme";
import "./index.css";

// Stamp the stored theme before the first paint so the page never flashes the wrong colours.
applyTheme(storedTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InvestorsProvider>
      <GoldProvider>
        <BackupProvider>
          <App />
        </BackupProvider>
      </GoldProvider>
    </InvestorsProvider>
  </StrictMode>,
);
