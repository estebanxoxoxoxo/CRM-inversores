import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import InvestorsProvider from "./context/InvestorsProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InvestorsProvider>
      <App />
    </InvestorsProvider>
  </StrictMode>,
);
