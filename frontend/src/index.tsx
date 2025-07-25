import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Buffer } from "buffer";

declare global {
  interface Window {
    /** used by react-pdf under the hood */
    Buffer: typeof Buffer;
  }
}
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}

const el = document.getElementById("root");
if (!el) throw new Error("Root element not found");

ReactDOM.createRoot(el).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
