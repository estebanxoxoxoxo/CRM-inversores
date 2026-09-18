import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import BackupProvider from "./context/BackupProvider";
import GoldProvider from "./gold/context/GoldProvider";
import InvestorsProvider from "./bronze/context/InvestorsProvider";
import ListsProvider from "./lists/context/ListsProvider";
import { applyTheme, storedTheme } from "./lib/theme";
import "./index.css";

// Stamp the stored theme before the first paint so the page never flashes the wrong colours.
applyTheme(storedTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InvestorsProvider>
      <GoldProvider>
        <ListsProvider>
          <BackupProvider>
            <App />
          </BackupProvider>
        </ListsProvider>
      </GoldProvider>
    </InvestorsProvider>
  </StrictMode>,
);
