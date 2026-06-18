// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global reset
const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f18; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0f0f18; }
  ::-webkit-scrollbar-thumb { background: #2d2d4e; border-radius: 3px; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
