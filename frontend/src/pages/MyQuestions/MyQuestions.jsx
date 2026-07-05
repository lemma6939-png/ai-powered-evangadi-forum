import { useEffect, useState } from "react";
/* react hooks ,run code after compent display/stord ques,load,error*/
import { Link } from "react-router-dom";
<<<<<<< HEAD
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
=======
/**with out refreshing pages changing smoothly */
>>>>>>> Fe24
import { getMyQuestions } from "../../services/question/question.service";
/**calls the bacend api,eg get/api/qu/me */
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
/**creat page user see/stor all ques,err messg,track data is loading from server */
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
            Only questions you created. Open one to read answers or add
            follow-ups. Rows use the same left accent as your threads on Home.
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
{/**load once,empty array,return,page container,heading,title,desc,new ques link to ask ques, */}
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
                <div className={styles.previewContent}>
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {question.content || ""}
                  </ReactMarkdown>
                </div>

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
<<<<<<< HEAD
=======
/**map loop through every ques,db/quesHash-to identify eachRow impruv performanc */
>>>>>>> Fe24
