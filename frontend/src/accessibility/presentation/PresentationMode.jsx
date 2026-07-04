import {useState} from "react";
import {presentationSlides} from "./presentationSlides";
import usePresentationKeyboard from "./presentationKeyboard";
import {
  readSlide,
  repeatSlide,
  pauseReading,
  resumeReading,
  stopReading,
} from "./presentationReader";

export default function PresentationMode({onClose}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const slide = presentationSlides[currentSlide];

  const nextSlide = () => {
    if (currentSlide < presentationSlides.length - 1) {
      stopReading();
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 0) {
      stopReading();
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const togglePause = () => {
    if (paused) {
      resumeReading();
    } else {
      pauseReading();
    }
    setPaused(!paused);
  };

  usePresentationKeyboard({
    nextSlide,
    previousSlide,
    readSlide: () => readSlide(slide),
    pauseResume: togglePause,
    exitPresentation: () => {
      stopReading();
      onClose();
    },
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          width: "85%",
          maxWidth: "900px",
          background: "#fff",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 0 20px rgba(0,0,0,.4)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: "right",
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ✖ Close
        </button>

        <h1 style={{color: "#0066ff"}}>AI Accessibility Presentation</h1>

        <h2>
          Slide {currentSlide + 1} / {presentationSlides.length}
        </h2>

        <div
          style={{
            height: "12px",
            background: "#ddd",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: `${
                ((currentSlide + 1) / presentationSlides.length) * 100
              }%`,
              height: "100%",
              background: "#0066ff",
              borderRadius: "10px",
            }}
          />
        </div>

        <h2>{slide.title}</h2>

        <div
          style={{
            minHeight: "220px",
            fontSize: "22px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
          }}
        >
          {slide.content}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "30px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <button onClick={previousSlide}>⬅ Previous</button>

          <button onClick={() => readSlide(slide)}>🔊 Read</button>

          <button onClick={togglePause}>
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>

          <button onClick={repeatSlide}>🔁 Repeat</button>

          <button onClick={nextSlide}>Next ➡</button>
        </div>

        <hr style={{margin: "30px 0"}} />

        <h3>Keyboard Shortcuts</h3>

        <p>⬅ Left Arrow = Previous Slide</p>

        <p>➡ Right Arrow = Next Slide</p>

        <p>Enter = Read Current Slide</p>

        <p>Space = Pause / Resume</p>

        <p>Esc = Exit Presentation</p>
      </div>
    </div>
  );
}
