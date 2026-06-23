import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { isAuthoredByUser } from "../../lib/utils";
import {
  getQuestion,
  getSimilarQuestions,
} from "../../services/question/question.service";
import { answerService } from "../../services/answer/answer.service";
import styles from "./QuestionDetail.module.css";

export default function QuestionDetail() {
// 
//   const [data, setData] = useState({
//   question: null,
//   answers: [],
//   answerText: "",      
//   loading: true,       //Monolithic State Blob
// });
// setData({
//   ...data,
//   answerText: "H"
// });
  const { questionHash } = useParams();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [fitResult, setFitResult] = useState(null);
  const [message, setMessage] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isOwnQuestion = isAuthoredByUser(question, user);
  const isWeakDraft = fitResult?.level === "weak";

  const getErrorMessage = (error, fallback) => {
    return (
      error?.response?.data?.msg ||
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      fallback
    );
  };

  const loadRelatedQuestions = async () => {
    try {
      const result = await getSimilarQuestions(questionHash);
      setRelatedQuestions(result.data || result || []);
    } catch {
      setRelatedQuestions([]);
    }
  };

  const loadQuestion = async () => {
    try {
      setLoading(true);
      setMessage("");

      const result = await getQuestion(questionHash);

      setQuestion(result.question || result.data?.question);
      setAnswers(result.answers || result.data?.answers || []);
      await loadRelatedQuestions();
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to load question details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionHash) {
      loadQuestion();
    }
  }, [questionHash]);

  const handleAnswerFit = async () => {
    try {
      setMessage("");

      const result = await answerService.answerFit(questionHash, answerText);
      setFitResult(result.data || result);
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to evaluate answer."));
    }
  };

  const handleShare = async () => {
    if (!question) return;

    const shareUrl = window.location.href;
    const title = question.title || "Question detail";
    const text = `Check out this question: ${question.title}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        setShareStatus("Question shared successfully.");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Question link copied to clipboard.");
      }
    } catch {
      setShareStatus(
        "Unable to share automatically. Copy the URL from your browser instead.",
      );
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();

    if (!answerText.trim()) {
      setMessage("Please write an answer before posting.");
      return;
    }

    if (isOwnQuestion) {
      setMessage("You cannot answer your own question.");
      return;
    }

    if (isWeakDraft) {
      setMessage(
        "Weak draft answers cannot be submitted. Improve your response first.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      await answerService.createAnswer({
        questionId: question.id,
        content: answerText,
      });

      setAnswerText("");
      setFitResult(null);

      await loadQuestion();
    } catch (error) {
      setMessage(
        getErrorMessage(error, "Failed to post answer. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.centerState}>
        <p>Loading question details...</p>
      </section>
    );
  }

  if (!question) {
    return (
      <section className={styles.centerState}>
        <p className={styles.errorText}>Failed to load question details.</p>
        <Link to="/dashboard" className={styles.orangeBtn}>
          Return to Dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <Link to="/dashboard" className={styles.backLink}>
          ← Back to feed
        </Link>

        <article className={styles.questionCard}>
          <div className={styles.authorRow}>
            <div className={styles.avatar}>NU</div>
            <div>
              <h4>
                {question.author?.firstName || "New"}{" "}
                {question.author?.lastName || "User"}
              </h4>
              <p>Posted question</p>
            </div>
          </div>

          <h2>{question.title}</h2>
          <p className={styles.questionText}>{question.content}</p>

          <div className={styles.cardActions}>
            <button type="button" onClick={handleShare}>
              Share
            </button>
            <button type="button">{answers.length} Answers</button>
          </div>
          {shareStatus && <p className={styles.shareText}>{shareStatus}</p>}
        </article>

        <h3 className={styles.sectionTitle}>
          Community Answers ({answers.length})
        </h3>

        {answers.length === 0 ? (
          <div className={styles.emptyBox}>
            <div className={styles.emptyIcon}>▢</div>
            <h4>Be the first to help!</h4>
            <p>
              This question is waiting for an expert like you. Share your
              knowledge and earn reputation points.
            </p>
          </div>
        ) : (
          <div className={styles.answers}>
            {answers.map((answer) => (
              <article key={answer.id} className={styles.answerCard}>
                <div className={styles.authorRow}>
                  <div className={styles.avatar}>NU</div>
                  <div>
                    <h4>
                      {answer.author?.firstName || "New"}{" "}
                      {answer.author?.lastName || "User"}
                    </h4>
                    <p>Community answer</p>
                  </div>
                </div>

                <p className={styles.answerText}>{answer.content}</p>
              </article>
            ))}
          </div>
        )}

        <form className={styles.answerForm} onSubmit={handleSubmitAnswer}>
          <h3>Contribute an answer</h3>

          {message && <p className={styles.errorText}>{message}</p>}

          <div className={styles.toolbar}>
            <span>B</span>
            <span>I</span>
            <span>🔗</span>
            <span>&lt;/&gt;</span>
            <small>{answerText.length} characters</small>
          </div>

          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder={
              isOwnQuestion
                ? "You cannot answer your own question."
                : "Type your answer here..."
            }
            disabled={isOwnQuestion}
          />

          <div className={styles.formFooter}>
            <button
              type="button"
              className={styles.fitBtn}
              onClick={handleAnswerFit}
              disabled={!answerText.trim() || submitting || isOwnQuestion}
            >
              Check draft fit
            </button>

            <button
              type="submit"
              className={styles.orangeBtn}
              disabled={submitting || isOwnQuestion || isWeakDraft}
            >
              {submitting ? "Posting..." : "Post Your Answer"}
            </button>
          </div>

          {(isOwnQuestion || isWeakDraft) && (
            <div className={styles.warningBox}>
              {isOwnQuestion && (
                <p>You cannot post an answer to your own question.</p>
              )}
              {isWeakDraft && (
                <p>
                  Weak answers are not allowed for posting. Please rewrite with
                  more clarity.
                </p>
              )}
            </div>
          )}

          {fitResult && (
            <div className={styles.fitBox}>
              <strong>AI Answer Evaluation</strong>
              <p>
                <b>Level:</b> {fitResult.level}
              </p>
              <p>{fitResult.note}</p>
            </div>
          )}
        </form>
      </div>

      <aside className={styles.side}>
        <h3>Related Questions</h3>

        {relatedQuestions.length === 0 ? (
          <div className={styles.relatedEmpty}>
            <p>No related questions found yet.</p>
          </div>
        ) : (
          relatedQuestions.map((related) => (
            <Link
              key={related.questionHash || related.id}
              to={`/question/${related.questionHash}`}
              className={styles.relatedCard}
            >
              <h4>{related.title}</h4>
              <p>{related.content?.slice(0, 60) || "View details"}</p>
            </Link>
          ))
        )}
      </aside>
    </section>
  );
}
