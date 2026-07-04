// src/accessibility/AccessibilityWidget.jsx
// Floating blue button with accessibility panel – includes microphone permission fix.
// helps presentattion/pr mode lik App.jsx

import React, {useState, useRef} from "react";

import PresentationMode from "./presentation/PresentationMode";

import {speak, stopSpeaking} from "./textToSpeech";
import {
  requestMicrophonePermission,
  initSpeechToText,
  startListening,
  stopListening,
} from "./speechToText";
import {processVoiceCommand} from "./voiceCommands";
import {useAccessibility} from "./AccessibilityProvider";
import styles from "./AccessibilityWidget.module.css";

const AccessibilityWidget = () => {
  const {highContrast, setHighContrast, largeText, setLargeText} =
    useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
const [showPresentation, setShowPresentation] = useState(false);
  const toggleWidget = () => {
    setIsOpen(!isOpen);
    speak(isOpen ? "Panel closed" : "Accessibility panel opened");
  };

  const readPage = () => {
    const text = document.body.innerText;
    speak(text, () => speak("Finished reading page"));
  };

  const stopReading = () => {
    stopSpeaking();
    speak("Stopped reading");
  };

  // ─── Voice command with permission request ───────────────────────────
  const startVoiceCommand = async () => {
    // If already listening, stop
    if (isListening) {
      stopListening();
      setIsListening(false);
      speak("Voice listening stopped");
      return;
    }

    // 1. Request microphone permission explicitly via getUserMedia
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert(
        "Microphone access is required for voice commands. " +
          "Please allow microphone permissions in your browser settings and refresh the page.",
      );
      return;
    }

    // 2. Initialise SpeechRecognition (if not already)
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechToText(
        (transcript) => {
          setTranscript(transcript);
          processVoiceCommand(transcript);
          setIsListening(false);
        },
        (error) => {
          console.error("Voice command error:", error);
          speak("Sorry, I could not hear you. Please try again.");
          setIsListening(false);
        },
      );
    }

    // 3. Start listening
    startListening();
    setIsListening(true);
    speak("Listening for voice commands");
  };
  // ──────────────────────────────────────────────────────────────────────

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    speak(highContrast ? "High contrast off" : "High contrast on");
  };

  const toggleLargeText = () => {
    setLargeText(!largeText);
    speak(largeText ? "Large text off" : "Large text on");
  };

  return (
    <div className={styles.widgetContainer}>
      <button
        className={styles.widgetButton}
        onClick={toggleWidget}
        aria-label="Accessibility options"
        style={{backgroundColor: "#0066FF"}}
      >
        <span role="img" aria-hidden="true">
          ♿
        </span>
      </button>
      {isOpen && (
        <div className={styles.widgetPanel}>
          <h3 className={styles.title}>Accessibility Help</h3>
          <button className={styles.button} onClick={readPage}>
            🔊 Read Page
          </button>
          <button className={styles.button} onClick={stopReading}>
            ⏹ Stop Reading
          </button>
          <button className={styles.button} onClick={startVoiceCommand}>
            {isListening ? "⏹ Stop Listening" : "🎤 Voice Command"}
          </button>
          <button
            className={styles.button}
            onClick={() => {
              stopSpeaking();
              setShowPresentation(true);
              speak("Presentation mode opened");
            }}
          >
            🎓 Presentation Mode
          </button>

          <button className={styles.button} onClick={toggleContrast}>
            {highContrast ? "🌙 Normal Contrast" : "☀️ High Contrast"}
          </button>
          <button className={styles.button} onClick={toggleLargeText}>
            {largeText ? "🔍 Normal Text" : "🔍 Large Text"}
          </button>
          {transcript && (
            <p className={styles.transcript}>You said: "{transcript}"</p>
          )}
          <small className={styles.hint}>
            Commands: "Open Dashboard", "Ask Question", "Read Current Page",
            etc.
          </small>
        </div>
      )}

      {showPresentation && (
        <PresentationMode
          onClose={() => {
            stopSpeaking();
            setShowPresentation(false);
            speak("Presentation closed");
          }}
        />
      )}
    </div>
  );
};

export default AccessibilityWidget;
