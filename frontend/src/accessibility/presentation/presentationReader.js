//instad of call eachword/read H slid
import {speak, stopSpeaking} from "../textToSpeech";

let currentSpeech = "";

export const readSlide = (slide) => {
  if (!slide) return;

  currentSpeech = `${slide.title}. ${slide.content}`;

  stopSpeaking();
  speak(currentSpeech);
};

export const repeatSlide = () => {
  if (currentSpeech) {
    stopSpeaking();
    speak(currentSpeech);
  }
};

export const pauseReading = () => {
  window.speechSynthesis.pause();
};

export const resumeReading = () => {
  window.speechSynthesis.resume();
};

export const stopReading = () => {
  stopSpeaking();
};
