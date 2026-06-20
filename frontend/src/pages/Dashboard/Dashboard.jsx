import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PenSquare, ListTodo, LibraryBig } from "lucide-react";
import {
  getQuestions,
  searchQuestionsSemantic,
} from "../../services/question/question.service";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 3,
    total: 0,
    totalPages: 1,
  });
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") || "",
  );
  const [searchMode, setSearchMode] = useState(
    searchParams.get("semantic") === "true" ? "semantic" : "keyword",
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const firstName = user?.firstName?.trim() || "there";

  const stats = useMemo(() => {
    const total = meta.total || questions.length;
    const replies = questions.reduce(
      (sum, q) => sum + Number(q.answerCount || 0),
      0,
    );
    const unanswered = questions.filter((q) => !q.answerCount).length;

    return { total, replies, unanswered };
  }, [meta.total, questions]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const keyword = searchParams.get("q");
      const semantic = searchParams.get("semantic") === "true";
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 3;

      if (semantic) {
        const result = await searchQuestionsSemantic(keyword || "");
        setQuestions(result.data || []);
        setMeta((current) => ({
          ...current,
          page: 1,
          total: result.data?.length || 0,
          totalPages: 1,
        }));
        return;
      }

      const params = { page, limit };
      if (keyword) params.search = keyword;

      const result = await getQuestions(params);
      setQuestions(result.data || []);
      setMeta((current) => ({
        ...current,
        page: result.meta?.page || page,
        limit: result.meta?.limit || limit,
        total: result.meta?.total || 0,
        totalPages: result.meta?.totalPages || 1,
      }));
    } catch (error) {
      setMessage(error.response?.data?.msg || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [searchParams]);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    } else {
      params.delete("q");
    }

    if (searchMode === "semantic") {
      params.set("semantic", "true");
    } else {
      params.delete("semantic");
    }

    params.set("page", "1");
    params.set("limit", String(meta.limit));
    setSearchParams(params);
  };

  const changePage = (newPage) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", newPage);
      params.set("limit", meta.limit);
      return params;
    });
  };

  const canGoBack = meta.page > 1;
  const canGoForward = meta.page < meta.totalPages;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.headerRow}>
          <div>
            <span>FORUM HOME</span>
            <h1>Good to see you, {firstName}.</h1>
            <p>
              Start a topic, revisit your own threads, or skim the live feed.
            </p>
          </div>

          <div className={styles.searchColumn}>
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <input
                type="text"
                value={searchInput}
                placeholder="Search questions by keyword..."
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
            </form>

            <div className={styles.searchMode}>
              <button
                type="button"
                className={
                  searchMode === "keyword"
                    ? styles.modeActive
                    : styles.modeButton
                }
                onClick={() => setSearchMode("keyword")}
              >
                Keyword
              </button>
              <button
                type="button"
                className={
                  searchMode === "semantic"
                    ? styles.modeActive
                    : styles.modeButton
                }
                onClick={() => setSearchMode("semantic")}
              >
                Semantic
              </button>
            </div>
          </div>
        </div>

        {/* <div className={styles.heroCards}>
          <Link to="/questions/ask" className={styles.actionCard}>
            <strong>New question</strong>
            <small>Share context, errors, and what you already tried</small>
          </Link>

          <Link to="/my-questions" className={styles.actionCard}>
            <strong>Your topics</strong>
            <small>Filtered list of threads you authored</small>
          </Link>

          <Link to="/rag-documents" className={styles.actionCard}>
            <strong>Knowledge base</strong>
            <small>Upload docs and ask retrieval-backed questions</small>
          </Link>
        </div> */}

        {/* <div className={styles.heroCards}>
          <Link to="/questions/ask" className={styles.actionCard}>
            <div className={styles.cardIcon}>✏️</div>

            <div>
              <h3>New question</h3>
              <p>Share context, errors, and what you already tried</p>
            </div>
          </Link>

          <Link to="/my-questions" className={styles.actionCard}>
            <div className={styles.cardIcon}>📋</div>

            <div>
              <h3>Your topics</h3>
              <p>Filtered list of threads you authored</p>
            </div>
          </Link>

          <Link to="/rag-documents" className={styles.actionCard}>
            <div className={styles.cardIcon}>📚</div>

            <div>
              <h3>Knowledge base</h3>
              <p>Source library, uploads and retrieval-backed context</p>
            </div>
          </Link>
        </div> */}
        <div className={styles.heroCards}>
          <Link to="/questions/ask" className={styles.actionCard}>
            <div className={styles.cardIcon}>
              <PenSquare size={24} />
            </div>

            <div>
              <h3>New Question</h3>
              <p>Share context, errors, and what you already tried</p>
            </div>
          </Link>

          <Link to="/my-questions" className={styles.actionCard}>
            <div className={styles.cardIcon}>
              <ListTodo size={24} />
            </div>

            <div>
              <h3>Your Topics</h3>
              <p>View and manage the discussions you've created</p>
            </div>
          </Link>

          <Link to="/rag-documents" className={styles.actionCard}>
            <div className={styles.cardIcon}>
              <LibraryBig size={24} />
            </div>

            <div>
              <h3>Knowledge Base</h3>
              <p>Upload documents and ask AI-powered questions</p>
            </div>
          </Link>
        </div>
        <div className={styles.stats}>
          <div>
            <small>Questions</small>
            <strong>{stats.total}</strong>
          </div>

          <div>
            <small>Replies</small>
            <strong>{stats.replies}</strong>
          </div>

          <div>
            <small>Unanswered</small>
            <strong>{stats.unanswered}</strong>
          </div>

          <div>
            <small>Yours</small>
            <strong>
              {questions.filter((q) => q.author?.id === user?.id).length}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.feed}>
        <div className={styles.feedHeader}>
          <div>
            <h2>Discussion feed</h2>
            <p>Your threads use a slim left accent in this list.</p>
          </div>

          <Link to="/questions/ask" className={styles.orangeButton}>
            New Question
          </Link>
        </div>

        {loading && (
          <div className={styles.loadingBox}>Loading recent questions...</div>
        )}

        {!loading && message && (
          <div className={styles.errorBox}>{message}</div>
        )}

        {!loading && !message && questions.length === 0 && (
          <div className={styles.emptyBox}>
            No questions found. Be the first to ask!
          </div>
        )}

        {!loading &&
          !message &&
          questions.map((question) => (
            <Link
              key={question.questionHash || question.id}
              to={`/questions/${question.questionHash}`}
              className={styles.thread}
            >
              <div className={styles.avatar}>
                {(question.author?.firstName || "U")[0]}
              </div>

              <div>
                <h3>{question.title}</h3>
                <p>{question.content}</p>
                <small>
                  {question.author?.firstName || "Unknown"}{" "}
                  {question.author?.lastName || ""} ·{" "}
                  {question.answerCount || 0} replies
                  {question.score ? ` · score ${question.score}` : ""}
                </small>
              </div>
            </Link>
          ))}

        {!loading && !message && questions.length > 0 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => changePage(meta.page - 1)}
              disabled={!canGoBack}
            >
              Previous
            </button>

            <span className={styles.pageInfo}>
              Page {meta.page} of {meta.totalPages}
            </span>

            <button
              type="button"
              className={styles.pageButton}
              onClick={() => changePage(meta.page + 1)}
              disabled={!canGoForward}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
