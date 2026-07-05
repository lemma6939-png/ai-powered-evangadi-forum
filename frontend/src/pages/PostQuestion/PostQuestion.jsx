import {useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {
  createQuestion,
  draftCoach,
} from "../../services/question/question.service";
import {
  initSpeechToText,
  startListening,
  stopListening,
} from "../../accessibility/speechToText";
import {speak} from "../../accessibility/textToSpeech";
import styles from "../PostQuestion/PostQuestion.module.css";

export default function PostQuestion() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tips, setTips] = useState([]);
  const [status, setStatus] = useState({type: "", text: ""});
  const [loading, setLoading] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);

  const titleCount = title.trim().length;
  const contentCount = content.trim().length;

  // Voice states
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningContent, setIsListeningContent] = useState(false);
  const titleRecognitionRef = useRef(null);
  const contentRecognitionRef = useRef(null);

  const startTitleVoice = () => {
    if (isListeningTitle) {
      stopListening();
      setIsListeningTitle(false);
      return;
    }
    if (!titleRecognitionRef.current) {
      titleRecognitionRef.current = initSpeechToText(
        (text) => {
          setTitle(text);
          setIsListeningTitle(false);
          speak("Title filled");
        },
        () => speak("Could not hear you"),
      );
    }
    startListening();
    setIsListeningTitle(true);
    speak("Please speak the question title");
  };

  const startContentVoice = () => {
    if (isListeningContent) {
      stopListening();
      setIsListeningContent(false);
      return;
    }
    if (!contentRecognitionRef.current) {
      contentRecognitionRef.current = initSpeechToText(
        (text) => {
          setContent(text);
          setIsListeningContent(false);
          speak("Details filled");
        },
        () => speak("Could not hear you"),
      );
    }
    startListening();
    setIsListeningContent(true);
    speak("Please speak the question details");
  };

  const readQuestion = () => {
    speak(`Title: ${title}. Details: ${content}`);
  };

  const validateForm = () => {
    if (title.trim().length < 5) {
      setStatus({type: "error", text: "Title must be at least 5 characters."});
      return false;
    }
    if (content.trim().length < 10) {
      setStatus({
        type: "error",
        text: "Question details must be at least 10 characters.",
      });
      return false;
    }
    return true;
  };

  const handleDraftCoach = async () => {
    if (content.trim().length < 10) {
      setStatus({
        type: "error",
        text: "Write at least 10 characters before using AI suggestions.",
      });
      return;
    }
    try {
      setCoachLoading(true);
      setStatus({type: "", text: ""});
      const result = await draftCoach({
        title: title.trim(),
        content: content.trim(),
      });
      setTips(result.data?.tips || []);
    } catch (error) {
      let message = "Failed to get AI suggestions.";

      // Axios error format
      if (error?.response?.data) {
        const data = error.response.data;

        message = data?.msg || data?.message || data?.error?.message || message;
      }

      // Fallback for non-Axios / stringified errors
      else if (error?.error?.message) {
        message = error.error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setStatus({
        type: "error",
        text: message,
      });
    } finally {
      setCoachLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setStatus({type: "info", text: "Posting your question..."});
      const result = await createQuestion({
        title: title.trim(),
        content: content.trim(),
      });
      setStatus({type: "success", text: "Question posted successfully."});
      setTimeout(() => {
        navigate(`/questions/${result.data.questionHash}`);
      }, 600);
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error.response?.data?.msg ||
          "Failed to post question. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <span>ASK THE COMMUNITY</span>
        <h1>Publish to the forum</h1>
        <p>
          Public threads help the whole cohort. Write as if a classmate will
          debug your issue tomorrow. They only know what you put on the page.
        </p>
      </section>

      <section className={styles.guide}>
        <h3>Write questions people can answer in one pass</h3>
        <p>
          Mentors volunteer their time. Give them runnable context, expected vs
          actual behavior, and a tight scope so they can reproduce the issue
          without guessing your setup.
        </p>
        <div className={styles.guideGrid}>
          <div>
            <h4>Checklist before you post</h4>
            <ul>
              <li>Give an exact, searchable title.</li>
              <li>Show the error message or broken behavior.</li>
              <li>Include the smallest relevant code snippet.</li>
              <li>Explain what you expected to happen.</li>
            </ul>
          </div>
          <div>
            <h4>Validation rules</h4>
            <ul>
              <li>Title length: at least 5 characters.</li>
              <li>Body length: at least 10 characters.</li>
              <li>Single topic: avoid combining unrelated issues.</li>
            </ul>
          </div>
        </div>
      </section>

      <form className={styles.card} onSubmit={handleSubmit}>
        {status.text && (
          <div className={`${styles.status} ${styles[status.type]}`}>
            {status.text}
          </div>
        )}

        <div className={styles.field}>
          <label>Title</label>
          <p>
            Be specific and imagine you are asking a question to another person.
          </p>
          <div style={{display: "flex", gap: "8px"}}>
            <input
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How do I handle state management using Context API in React?"
              style={{flex: 1}}
            />
            <button
              type="button"
              onClick={startTitleVoice}
              style={{
                backgroundColor: "#0066FF",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "0 12px",
              }}
            >
              {isListeningTitle ? "⏹" : "🎤"}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.row}>
            <div>
              <label>What are the details of your problem?</label>
              <p>Include the problem and output or error so others can help.</p>
            </div>
            <small>{contentCount} characters</small>
          </div>
          <div style={{display: "flex", gap: "8px"}}>
            <textarea
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Include all the information someone would need to answer your question..."
              style={{flex: 1}}
            />
            <button
              type="button"
              onClick={startContentVoice}
              style={{
                backgroundColor: "#0066FF",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "0 12px",
                alignSelf: "flex-start",
              }}
            >
              {isListeningContent ? "⏹" : "🎤"}
            </button>
          </div>
        </div>

        {tips.length > 0 && (
          <div className={styles.tips}>
            <h3>AI Suggestions</h3>
            <ul>
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.footer}>
          <div style={{display: "flex", gap: "8px"}}>
            <button
              type="button"
              onClick={handleDraftCoach}
              disabled={coachLoading || loading}
            >
              {coachLoading ? "Checking..." : "AI suggestions"}
            </button>
            <button
              type="button"
              onClick={readQuestion}
              style={{
                backgroundColor: "#0066FF",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "11px 16px",
              }}
            >
              🔊 Read Question
            </button>
          </div>
          <div className={styles.rightActions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Posting..." : "Post Question"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   createQuestion,
//   draftCoach,
// } from "../../services/question/question.service";
// import styles from "../PostQuestion/PostQuestion.module.css";

// export default function PostQuestion() {
//   const navigate = useNavigate();

//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [tips, setTips] = useState([]);
//   const [status, setStatus] = useState({ type: "", text: "" });
//   const [loading, setLoading] = useState(false);
//   const [coachLoading, setCoachLoading] = useState(false);

//   const titleCount = title.trim().length;
//   const contentCount = content.trim().length;

//   const validateForm = () => {
//     if (title.trim().length < 5) {
//       setStatus({
//         type: "error",
//         text: "Title must be at least 5 characters.",
//       });
//       return false;
//     }

//     if (content.trim().length < 10) {
//       setStatus({
//         type: "error",
//         text: "Question details must be at least 10 characters.",
//       });
//       return false;
//     }

//     return true;
//   };

//   const handleDraftCoach = async () => {
//     if (content.trim().length < 10) {
//       setStatus({
//         type: "error",
//         text: "Write at least 10 characters before using AI suggestions.",
//       });
//       return;
//     }

//     try {
//       setCoachLoading(true);
//       setStatus({ type: "", text: "" });

//       const result = await draftCoach({
//         title: title.trim(),
//         content: content.trim(),
//       });

//       setTips(result.data?.tips || []);
//     } catch (error) {
//       setStatus({
//         type: "error",
//         text: error.response?.data?.msg || "Failed to get AI suggestions.",
//       });
//     } finally {
//       setCoachLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     try {
//       setLoading(true);
//       setStatus({
//         type: "info",
//         text: "Posting your question...",
//       });

//       const result = await createQuestion({
//         title: title.trim(),
//         content: content.trim(),
//       });

//       setStatus({
//         type: "success",
//         text: "Question posted successfully.",
//       });

//       setTimeout(() => {
//         navigate(`/questions/${result.data.questionHash}`);
//       }, 600);
//     } catch (error) {
//       setStatus({
//         type: "error",
//         text:
//           error.response?.data?.msg ||
//           "Failed to post question. Please try again.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles.page}>
//       <section className={styles.header}>
//         <span>ASK THE COMMUNITY</span>
//         <h1>Publish to the forum</h1>
//         <p>
//           Public threads help the whole cohort. Write as if a classmate will
//           debug your issue tomorrow. They only know what you put on the page.
//         </p>
//       </section>

//       <section className={styles.guide}>
//         <h3>Write questions people can answer in one pass</h3>
//         <p>
//           Mentors volunteer their time. Give them runnable context, expected vs
//           actual behavior, and a tight scope so they can reproduce the issue
//           without guessing your setup.
//         </p>

//         <div className={styles.guideGrid}>
//           <div>
//             <h4>Checklist before you post</h4>
//             <ul>
//               <li>Give an exact, searchable title.</li>
//               <li>Show the error message or broken behavior.</li>
//               <li>Include the smallest relevant code snippet.</li>
//               <li>Explain what you expected to happen.</li>
//             </ul>
//           </div>

//           <div>
//             <h4>Validation rules</h4>
//             <ul>
//               <li>Title length: at least 5 characters.</li>
//               <li>Body length: at least 10 characters.</li>
//               <li>Single topic: avoid combining unrelated issues.</li>
//             </ul>
//           </div>
//         </div>
//       </section>

//       <form className={styles.card} onSubmit={handleSubmit}>
//         {status.text && (
//           <div className={`${styles.status} ${styles[status.type]}`}>
//             {status.text}
//           </div>
//         )}

//         <div className={styles.field}>
//           <label>Title</label>
//           <p>
//             Be specific and imagine you are asking a question to another person.
//           </p>
//           <input
//             value={title}
//             maxLength={255}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="e.g. How do I handle state management using Context API in React?"
//           />
//         </div>

//         <div className={styles.field}>
//           <div className={styles.row}>
//             <div>
//               <label>What are the details of your problem?</label>
//               <p>Include the problem and output or error so others can help.</p>
//             </div>
//             <small>{contentCount} characters</small>
//           </div>

//           <textarea
//             rows={10}
//             value={content}
//             onChange={(e) => setContent(e.target.value)}
//             placeholder="Include all the information someone would need to answer your question..."
//           />
//         </div>

//         {tips.length > 0 && (
//           <div className={styles.tips}>
//             <h3>AI Suggestions</h3>
//             <ul>
//               {tips.map((tip, index) => (
//                 <li key={index}>{tip}</li>
//               ))}
//             </ul>
//           </div>
//         )}

//         <div className={styles.footer}>
//           <button
//             type="button"
//             onClick={handleDraftCoach}
//             disabled={coachLoading || loading}
//           >
//             {coachLoading ? "Checking..." : "AI suggestions"}
//           </button>

//           <div className={styles.rightActions}>
//             <button
//               type="button"
//               className={styles.cancel}
//               onClick={() => navigate("/dashboard")}
//             >
//               Cancel
//             </button>

//             <button type="submit" className={styles.submit} disabled={loading}>
//               {loading ? "Posting..." : "Post Question"}
//             </button>
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }
