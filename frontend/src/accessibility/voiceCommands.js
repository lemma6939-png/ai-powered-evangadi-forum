import {speak} from "./textToSpeech";

const commandMap = {
  "open dashboard": () => (window.location.href = "/dashboard"),
  "open questions": () => (window.location.href = "/dashboard"),
  "open ask question": () => (window.location.href = "/questions/ask"),
  "open my questions": () => (window.location.href = "/my-questions"),
  "open knowledge base": () => (window.location.href = "/rag-documents"),
  "open login": () => (window.location.href = "/auth"),
  "open register": () => (window.location.href = "/auth"),
  "read current page": () => {
    const text = document.body.innerText;
    speak(text);
  },
  "stop reading": () => {},
  "high contrast": () => {
    document.body.classList.toggle("high-contrast");
    speak("High contrast toggled");
  },
  "large text": () => {
    document.body.classList.toggle("large-text");
    speak("Large text toggled");
  },
};

export const processVoiceCommand = (transcript) => {
  const lower = transcript.toLowerCase().trim();
  for (const [phrase, action] of Object.entries(commandMap)) {
    if (lower.includes(phrase)) {
      action();
      return true;
    }
  }
  speak(
    "Command not recognised. Try: Open Dashboard, Ask Question, or Read Current Page.",
  );
  return false;
};
