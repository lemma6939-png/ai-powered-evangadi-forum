// frontend/src/accessibility/textToSpeech.js

let currentUtterance = null;

const synth = window.speechSynthesis;

export const stopSpeaking = () => {
  synth.cancel();
};

export const pauseSpeaking = () => {
  synth.pause();
};

export const resumeSpeaking = () => {
  synth.resume();
};

export const getVoices = () => {
  return synth.getVoices();
};

export const speak = (
  text,
  {rate = 1, pitch = 1, volume = 1, lang = "en-US", interrupt = true} = {},
) => {
  if (!text) return;

  if (interrupt) {
    synth.cancel();
  }

  currentUtterance = new SpeechSynthesisUtterance(text);

  currentUtterance.rate = rate;
  currentUtterance.pitch = pitch;
  currentUtterance.volume = volume;
  currentUtterance.lang = lang;

  const voices = synth.getVoices();

  const englishVoice =
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en"));

  if (englishVoice) {
    currentUtterance.voice = englishVoice;
  }

  synth.speak(currentUtterance);
};

window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};
// speak,pause,resume,stop,interrupt old speech


// let synth = window.speechSynthesis;
// let currentUtterance = null;

// export const speak = (text, onEnd) => {
//   if (!window.speechSynthesis) return;
//   if (synth.speaking) synth.cancel();
//   const utterance = new SpeechSynthesisUtterance(text);
//   utterance.lang = "en-US";
//   utterance.rate = 1;
//   utterance.pitch = 1;
//   utterance.volume = 1;
//   utterance.onend = () => {
//     currentUtterance = null;
//     if (onEnd) onEnd();
//   };
//   currentUtterance = utterance;
//   synth.speak(utterance);
// };

// export const stopSpeaking = () => {
//   if (synth.speaking) synth.cancel();
//   currentUtterance = null;
// };

// export const isSpeaking = () => synth.speaking;
