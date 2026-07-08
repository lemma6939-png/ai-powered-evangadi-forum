//dealing with the kebord use
import {useEffect} from "react";

export default function usePresentationKeyboard({
  nextSlide,
  previousSlide,
  readSlide,
  pauseResume,
  exitPresentation,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case "ArrowRight":
          nextSlide();
          break;

        case "ArrowLeft":
          previousSlide();
          break;

        case "Enter":
          readSlide();
          break;

        case " ":
          event.preventDefault();
          pauseResume();
          break;

        case "Escape":
          exitPresentation();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextSlide, previousSlide, readSlide, pauseResume, exitPresentation]);
}
