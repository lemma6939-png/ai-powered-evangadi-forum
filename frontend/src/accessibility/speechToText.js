// src/accessibility/speechToText.js
let recognition = null;

export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error("Microphone permission error:", error);
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      alert(
        "Microphone access is blocked by your browser.\n\n" +
          "Please click the 🔒 lock icon in the address bar, go to Site Settings, " +
          'and set Microphone to "Allow", then refresh this page.',
      );
    } else {
      alert("Could not access microphone: " + error.message);
    }
    return false;
  }
};

export const initSpeechToText = (onResult, onError, lang = "en-US") => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert(
      "Your browser does not support speech recognition. Please use Chrome or Edge.",
    );
    return null;
  }
  if (recognition) return recognition;
  recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (onResult) onResult(transcript);
  };
  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };
  return recognition;
};

export const startListening = () => {
  if (recognition) recognition.start();
};

export const stopListening = () => {
  if (recognition) recognition.stop();
};
