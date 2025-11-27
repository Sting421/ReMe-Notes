import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Polyfill Buffer for Vite (required for Cardano serialization libraries)
import { Buffer } from "buffer";
if (typeof (window as any).Buffer === "undefined") {
  (window as any).Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(<App />);
