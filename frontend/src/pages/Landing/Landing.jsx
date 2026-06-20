import { Link } from "react-router-dom";
import styles from "./Landing.module.css";

export default function Landing() {
  // TEMP FIX: replace with real auth state (context / redux / hook)
  const isAuthenticated = false;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span>E</span>
          <div>
            <h3>Evangadi Forum</h3>
            <p>Learn together. Ask with context.</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="#overview">Overview</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>

          <Link to={isAuthenticated ? "/dashboard" : "/dashboard"}>
            Sign in
          </Link>

          <Link
            to={isAuthenticated ? "/dashboard" : "/auth"}
            className={styles.headerBtn}
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.badge}>AI-powered learning forum</p>

          <h1>
            A calm place for <span>technical Q&A</span>
          </h1>

          <p>
            Post with enough context for peers to help in minutes. Search the
            archive by phrase or by meaning, keep your threads in one place, and
            get useful guidance to improve discussions with AI-assisted tools.
          </p>

          <div className={styles.actions}>
            <Link
              to={isAuthenticated ? "/dashboard" : "/dashboard"}
              className={styles.primaryBtn}
            >
              Get started
            </Link>

            <Link
              to={isAuthenticated ? "/ask" : "/dashboard"}
              className={styles.secondaryBtn}
            >
              Sign in to ask
            </Link>
          </div>
        </div>

        <div className={styles.aiCard}>
          <h4>AI QA Assist</h4>

          <div className={styles.aiItem}>
            <span>01</span>
            <p>Search similar threads and replies before posting.</p>
          </div>

          <div className={styles.aiItem}>
            <span>02</span>
            <p>Improve a draft with clearer context and expected behavior.</p>
          </div>

          <div className={styles.aiItem}>
            <span>03</span>
            <p>Connect learners to answers, resources, and next steps.</p>
          </div>
        </div>
      </section>

      <section id="overview" className={styles.band}>
        <div className={styles.sectionIntro}>
          <p>Overview</p>
          <h2>How Evangadi Q&A works with the forum</h2>
          <span>
            Create useful questions, help peers find similar problems, and grow
            your technical communication skills.
          </span>
        </div>

        <div className={styles.cardsThree}>
          <div className={styles.card}>
            <span>01</span>
            <h3>Share the full context</h3>
            <p>
              Explain the problem, what you tried, errors, expected result, and
              environment.
            </p>
          </div>

          <div className={styles.card}>
            <span>02</span>
            <h3>Search by meaning</h3>
            <p>
              Use semantic search to find related questions even when words are
              different.
            </p>
          </div>

          <div className={styles.card}>
            <span>03</span>
            <h3>Learn from answers</h3>
            <p>
              Read community answers, compare solutions, and keep helpful
              threads organized.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.sectionIntro}>
          <p>Features</p>
          <h2>Built for cohort coursework</h2>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span>💬</span>
            <h3>Post detailed questions</h3>
            <p>
              Ask with title, description, code context, and what you tried.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span>🔎</span>
            <h3>Semantic threads</h3>
            <p>Discover related discussions by meaning, not only keywords.</p>
          </div>

          <div className={styles.featureCard}>
            <span>✨</span>
            <h3>Lightweight AI help</h3>
            <p>
              Use AI support to improve question clarity and answer quality.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span>📚</span>
            <h3>Keep your answer library</h3>
            <p>Return to your own topics and reusable learning references.</p>
          </div>
        </div>
      </section>

      <section id="how" className={styles.how}>
        <div className={styles.sectionIntro}>
          <p>Workflow</p>
          <h2>How it works</h2>
        </div>

        <div className={styles.workflow}>
          <div>
            <b>Ask with context</b>
            <p>
              Add title, details, what failed, expected result, and tools used.
            </p>
          </div>

          <div>
            <b>Find answers</b>
            <p>Search keyword or AI similarity before creating a duplicate.</p>
          </div>

          <div>
            <b>Help others</b>
            <p>Write clear answers and improve your communication skills.</p>
          </div>

          <div>
            <b>Grow your profile</b>
            <p>Track your topics and build technical confidence over time.</p>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Ready when you are</h2>
        <p>Start a thread, search related topics, or help another learner.</p>

        <Link
          to={isAuthenticated ? "/dashboard" : "/auth"}
          className={styles.primaryBtn}
        >
          Create free account
        </Link>

        {/* <Link to="/register">Create free account</Link> */}
      </section>

      <footer className={styles.footer}>
        <div>
          <h3>Evangadi Forum</h3>
          <p>© 2026 Evangadi Forum</p>
        </div>

        <div>
          <a href="#overview">About</a>
          <a href="#features">Features</a>
          <a href="#how">Terms</a>
        </div>
      </footer>
    </main>
  );
}
