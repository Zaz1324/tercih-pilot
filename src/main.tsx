import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope";
import App from "./App";
import { ToastProvider } from "./contexts/ToastContext";
import { UniversityProvider } from "./contexts/UniversityContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <UniversityProvider>
        <App />
      </UniversityProvider>
    </ToastProvider>
  </React.StrictMode>,
);
