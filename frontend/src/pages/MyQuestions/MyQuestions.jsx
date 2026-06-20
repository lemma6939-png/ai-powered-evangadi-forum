import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyQuestions } from "../../services/question/question.service";
import styles from "./MyQuestions.module.css";

export default function MyQuestions() {
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMyQuestions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const result = await getMyQuestions();
      setQuestions(result.data || []);
    } catch (error) {
      setMessage(error.response?.data?.msg || "Failed to fetch questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyQuestions();
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span>Your Workspace</span>
          <h1>Your topics</h1>
          <p>
            Only questions you created. Open one to read answers or add follow-ups.
            Rows use the same left accent as your threads on Home.
          </p>
        </div>

        <Link to="/questions/ask" className={styles.newButton}>
          + New question
        </Link>
      </section>

      <section className={styles.content}>
        {loading && (
          <div className={styles.loadingBox}>Loading your questions...</div>
        )}

        {!loading && message && (
          <div className={styles.errorBox}>{message}</div>
        )}

        {!loading && !message && questions.length === 0 && (
          <div className={styles.emptyBox}>
            You have not asked any questions yet. Use Ask a Question in the
            sidebar to start.
          </div>
        )}

        {!loading &&
          !message &&
          questions.map((question) => (
            <Link
              key={question.questionHash || question.id}
              to={`/questions/${question.questionHash}`}
              className={styles.topicRow}
            >
              <div className={styles.accent}></div>

              <div className={styles.topicBody}>
                <h3>{question.title}</h3>
                <p>{question.content}</p>

                <small>
                  {question.answerCount || 0} replies ·{" "}
                  {new Date(question.createdAt).toLocaleDateString()}
                </small>
              </div>
            </Link>
          ))}
      </section>
    </div>
  );
}