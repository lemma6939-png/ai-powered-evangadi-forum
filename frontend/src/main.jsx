import {StrictMode} from "react";
import {createRoot} from "react-dom/client";

import "./index.css";

import App from "./App";

import {speak} from "./accessibility/textToSpeech";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Test the speech engine once the page has loaded.
window.addEventListener("load", () => {
  setTimeout(() => {
    speak("Accessibility assistant is ready.");
  }, 1000);
});

// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import './index.css';
// import App from './App';

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// );
