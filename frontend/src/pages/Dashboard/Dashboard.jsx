<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { useAuth } from "../../contexts/AuthContext";
import { PenSquare, ListTodo, LibraryBig } from "lucide-react";
=======
import {useEffect, useMemo, useState} from "react";
/**react hooks/fetch data url chags/statics , computing,avoid recalculat evry 561 render/holde component,questin,search input*/
import {Link, useSearchParams} from "react-router-dom";
/**react router,navigat pages w o refraesh/hook read,modify url,allow bookmark,shering */
import {useAuth} from "../../contexts/AuthContext";
/**custom hook access auth context,provides user state and personaliz greeting */
import {PenSquare, ListTodo, LibraryBig} from "lucide-react";
/**icons for new question, your topics, knowledge base */
>>>>>>> Fe24
import {
  getQuestions,
  searchQuestionsSemantic,
} from "../../services/question/question.service";
/**service functions to fetch questions from backend,keyword and semantic search */
import {speak} from "../../accessibility/textToSpeech";
/**text to speech function to read question title and content aloud */
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const {user} = useAuth();
  /**get the current logged in user from auth context to personalize greeting and filter questions */
  const [searchParams, setSearchParams] = useSearchParams();
  /**hook to read and modify the URL search parameters for search queries, pagination, and mode */
  const [questions, setQuestions] = useState([]);
  /**state to hold the list of questions fetched from the backend */
  const [meta, setMeta] = useState({
    page: 1,
    limit: 3,
    total: 0,
    totalPages: 1, 
  });
  /**state to hold pagination metadata for the questions list */
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") || "",
  );
  /**state to hold the current search input value, initialized from the URL search parameter */
  const [searchMode, setSearchMode] = useState(
    searchParams.get("semantic") === "true" ? "semantic" : "keyword",
  );
  /**state to hold the current search mode, either "keyword" or "semantic", initialized from the URL search parameter */
  const [message, setMessage] = useState("");
  /**state to hold any error or status messages related to question loading */
  const [loading, setLoading] = useState(true);
  /**state to track whether questions are currently being loaded from the backend */

  const firstName = user?.firstName?.trim() || "there";
  /**extract the first name of the logged-in user for personalized greeting, default to "there" if not available */

  const stats = useMemo(() => {
    const total = meta.total || questions.length;
    const replies = questions.reduce(
      (sum, q) => sum + Number(q.answerCount || 0),
      0,
    );
    /**calculate the total number of replies across all questions */
    const unanswered = questions.filter((q) => !q.answerCount).length;
    return {total, replies, unanswered};
  }, [meta.total, questions]);
  /**useMemo to compute statistics (total questions, total replies, unanswered questions) based on the current questions and metadata, avoiding unnecessary recalculations on every render */
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setMessage("");
      const keyword = searchParams.get("q");
      const semantic = searchParams.get("semantic") === "true";
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 3;

      /**fetch ,read the current search parameters from the URL for keyword, semantic mode (bool), page number, and limit */
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
      /**if semantic is true call semantic surch,no need pagination/setQuestion,result array,setMeta,reflect singlpag */

      const params = {page, limit};
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
      /**keyword search,build params,with pag limt,optional serch/getQuestion call set queston and meta from the respons/if api reterns to meta(paginaton info) will use it,esls gives difolt valu */
    } catch (error) {
      setMessage(error.response?.data?.msg || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };
  /** catch error, complet*/
  useEffect(() => {
    loadQuestions();
  }, [searchParams]);
  /**wherever searchparams changes,useEffect re fach question that help component reactiv to url,eg user click,pagination,submit,toggle */

  const handleSearch = (event) => {
    event.preventDefault();
    /**privent the defolt from submission(reload the page) */
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    } else {
      params.delete("q");
    }
    /**crate a copy of current quary params,if input is text ,set,else delete */
    if (searchMode === "semantic") {
      params.set("semantic", "true");
    } else {
      params.delete("semantic");
    }
/**if it is true=set,else remuve semantic based on page limit            (pagination handler)*/

    params.set("page", "1");
    params.set("limit", String(meta.limit));
    setSearchParams(params);
  };
/** for new search ,always rest page to 1 with limit,push new url,to triger useffect,to fach new data */
  const changePage = (newPage) => { 
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", newPage);
      params.set("limit", meta.limit);
      return params;
    });
  };
/**update the url page param,to newpage,keep limit useeffect,detact chang snd reload*/
  const canGoBack = meta.page > 1;
  const canGoForward = meta.page < meta.totalPages;
/**boolean,disable privious,or next button */
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
{ /** css modules handel personlized greething      (render hero) */ }
          <div className={styles.searchColumn}>
            {/* <form className={styles.searchForm} onSubmit={handleSearch}>
              <input
                type="text"
                value={searchInput}
                placeholder="Search questions by keyword..."
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
<<<<<<< HEAD
            </form> */}

            <div className={styles.searchMode}>
             
              
              
            </div>
=======
            </form>
           {/**search input searchinput state,handel submit button */} 
            {/* <div className={styles.searchMode}>
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
            </div> */}
>>>>>>> Fe24
          </div>
        </div>
 {/**keyword,semantic button handleler on click updat or swich surchMode stat, current url not change till"submit button triger*/}
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
{/**3 card link to othter page(debugging) (action card)*/}
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
{/**showes 4 metrics,count howmany q desplaid */}
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
{/**feed header secondaru New question (feed section) */}
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
{/**codtional rendering if loading-show loading message, elif,error,/empty state */}
        {!loading &&
          !message &&
          questions.map((question) => (
            <div
              key={question.questionHash || question.id}
              className={styles.threadWrapper}
            >
              <Link
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
                    {question.answerCount || 0} replies{" "}
                    {question.score ? `· score ${question.score}` : ""}
                  </small>
                </div>
              </Link>
              {/**map questin array only!lod ! error/wraped in a link with question hash*/}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  speak(`${question.title}. ${question.content}`);
                }}
                style={{
                  backgroundColor: "#0066FF",
                  color: "white",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  marginLeft: "auto",
                  alignSelf: "center",
                }}
              >
                🔊
              </button>
            </div>
          ))}
{/**privent bing trigerd befor click,call speek in the question title (pagination controll) */}
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
/**show only when ! ! and button cang with page number
 */
// import { useEffect, useMemo, useState } from "react";
// import { Link, useSearchParams } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
// import { PenSquare, ListTodo, LibraryBig } from "lucide-react";
// import {
//   getQuestions,
//   searchQuestionsSemantic,
// } from "../../services/question/question.service";
// import styles from "./Dashboard.module.css";

// export default function Dashboard() {
//   const { user } = useAuth();
//   const [searchParams, setSearchParams] = useSearchParams();

//   const [questions, setQuestions] = useState([]);
//   const [meta, setMeta] = useState({
//     page: 1,
//     limit: 3,
//     total: 0,
//     totalPages: 1,
//   });
//   const [searchInput, setSearchInput] = useState(
//     () => searchParams.get("q") || "",
//   );
//   const [searchMode, setSearchMode] = useState(
//     searchParams.get("semantic") === "true" ? "semantic" : "keyword",
//   );
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(true);

//   const firstName = user?.firstName?.trim() || "there";

//   const stats = useMemo(() => {
//     const total = meta.total || questions.length;
//     const replies = questions.reduce(
//       (sum, q) => sum + Number(q.answerCount || 0),
//       0,
//     );
//     const unanswered = questions.filter((q) => !q.answerCount).length;

//     return { total, replies, unanswered };
//   }, [meta.total, questions]);

//   const loadQuestions = async () => {
//     try {
//       setLoading(true);
//       setMessage("");

//       const keyword = searchParams.get("q");
//       const semantic = searchParams.get("semantic") === "true";
//       const page = Number(searchParams.get("page")) || 1;
//       const limit = Number(searchParams.get("limit")) || 3;

//       if (semantic) {
//         const result = await searchQuestionsSemantic(keyword || "");
//         setQuestions(result.data || []);
//         setMeta((current) => ({
//           ...current,
//           page: 1,
//           total: result.data?.length || 0,
//           totalPages: 1,
//         }));
//         return;
//       }

//       const params = { page, limit };
//       if (keyword) params.search = keyword;

//       const result = await getQuestions(params);
//       setQuestions(result.data || []);
//       setMeta((current) => ({
//         ...current,
//         page: result.meta?.page || page,
//         limit: result.meta?.limit || limit,
//         total: result.meta?.total || 0,
//         totalPages: result.meta?.totalPages || 1,
//       }));
//     } catch (error) {
//       setMessage(error.response?.data?.msg || "Failed to load questions.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadQuestions();
//   }, [searchParams]);

//   const handleSearch = (event) => {
//     event.preventDefault();
//     const params = new URLSearchParams(searchParams);

//     if (searchInput.trim()) {
//       params.set("q", searchInput.trim());
//     } else {
//       params.delete("q");
//     }

//     if (searchMode === "semantic") {
//       params.set("semantic", "true");
//     } else {
//       params.delete("semantic");
//     }

//     params.set("page", "1");
//     params.set("limit", String(meta.limit));
//     setSearchParams(params);
//   };

//   const changePage = (newPage) => {
//     setSearchParams((prev) => {
//       const params = new URLSearchParams(prev);
//       params.set("page", newPage);
//       params.set("limit", meta.limit);
//       return params;
//     });
//   };

//   const canGoBack = meta.page > 1;
//   const canGoForward = meta.page < meta.totalPages;

//   return (
//     <div className={styles.page}>
//       <section className={styles.hero}>
//         <div className={styles.headerRow}>
//           <div>
//             <span>FORUM HOME</span>
//             <h1>Good to see you, {firstName}.</h1>
//             <p>
//               Start a topic, revisit your own threads, or skim the live feed.
//             </p>
//           </div>

//           <div className={styles.searchColumn}>
//             <form className={styles.searchForm} onSubmit={handleSearch}>
//               <input
//                 type="text"
//                 value={searchInput}
//                 placeholder="Search questions by keyword..."
//                 onChange={(event) => setSearchInput(event.target.value)}
//               />
//               <button type="submit" className={styles.searchButton}>
//                 Search
//               </button>
//             </form>

//             <div className={styles.searchMode}>
//               <button
//                 type="button"
//                 className={
//                   searchMode === "keyword"
//                     ? styles.modeActive
//                     : styles.modeButton
//                 }
//                 onClick={() => setSearchMode("keyword")}
//               >
//                 Keyword
//               </button>
//               <button
//                 type="button"
//                 className={
//                   searchMode === "semantic"
//                     ? styles.modeActive
//                     : styles.modeButton
//                 }
//                 onClick={() => setSearchMode("semantic")}
//               >
//                 Semantic
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* <div className={styles.heroCards}>
//           <Link to="/questions/ask" className={styles.actionCard}>
//             <strong>New question</strong>
//             <small>Share context, errors, and what you already tried</small>
//           </Link>

//           <Link to="/my-questions" className={styles.actionCard}>
//             <strong>Your topics</strong>
//             <small>Filtered list of threads you authored</small>
//           </Link>

//           <Link to="/rag-documents" className={styles.actionCard}>
//             <strong>Knowledge base</strong>
//             <small>Upload docs and ask retrieval-backed questions</small>
//           </Link>
//         </div> */}

//         {/* <div className={styles.heroCards}>
//           <Link to="/questions/ask" className={styles.actionCard}>
//             <div className={styles.cardIcon}>✏️</div>

//             <div>
//               <h3>New question</h3>
//               <p>Share context, errors, and what you already tried</p>
//             </div>
//           </Link>

//           <Link to="/my-questions" className={styles.actionCard}>
//             <div className={styles.cardIcon}>📋</div>

//             <div>
//               <h3>Your topics</h3>
//               <p>Filtered list of threads you authored</p>
//             </div>
//           </Link>

//           <Link to="/rag-documents" className={styles.actionCard}>
//             <div className={styles.cardIcon}>📚</div>

//             <div>
//               <h3>Knowledge base</h3>
//               <p>Source library, uploads and retrieval-backed context</p>
//             </div>
//           </Link>
//         </div> */}
//         <div className={styles.heroCards}>
//           <Link to="/questions/ask" className={styles.actionCard}>
//             <div className={styles.cardIcon}>
//               <PenSquare size={24} />
//             </div>

//             <div>
//               <h3>New Question</h3>
//               <p>Share context, errors, and what you already tried</p>
//             </div>
//           </Link>

//           <Link to="/my-questions" className={styles.actionCard}>
//             <div className={styles.cardIcon}>
//               <ListTodo size={24} />
//             </div>

//             <div>
//               <h3>Your Topics</h3>
//               <p>View and manage the discussions you've created</p>
//             </div>
//           </Link>

//           <Link to="/rag-documents" className={styles.actionCard}>
//             <div className={styles.cardIcon}>
//               <LibraryBig size={24} />
//             </div>

//             <div>
//               <h3>Knowledge Base</h3>
//               <p>Upload documents and ask AI-powered questions</p>
//             </div>
//           </Link>
//         </div>
//         <div className={styles.stats}>
//           <div>
//             <small>Questions</small>
//             <strong>{stats.total}</strong>
//           </div>

//           <div>
//             <small>Replies</small>
//             <strong>{stats.replies}</strong>
//           </div>

//           <div>
//             <small>Unanswered</small>
//             <strong>{stats.unanswered}</strong>
//           </div>

//           <div>
//             <small>Yours</small>
//             <strong>
//               {questions.filter((q) => q.author?.id === user?.id).length}
//             </strong>
//           </div>
//         </div>
//       </section>

//       <section className={styles.feed}>
//         <div className={styles.feedHeader}>
//           <div>
//             <h2>Discussion feed</h2>
//             <p>Your threads use a slim left accent in this list.</p>
//           </div>

//           <Link to="/questions/ask" className={styles.orangeButton}>
//             New Question
//           </Link>
//         </div>

//         {loading && (
//           <div className={styles.loadingBox}>Loading recent questions...</div>
//         )}

//         {!loading && message && (
//           <div className={styles.errorBox}>{message}</div>
//         )}

//         {!loading && !message && questions.length === 0 && (
//           <div className={styles.emptyBox}>
//             No questions found. Be the first to ask!
//           </div>
//         )}

//         {!loading &&
//           !message &&
//           questions.map((question) => (
//             <Link
//               key={question.questionHash || question.id}
//               to={`/questions/${question.questionHash}`}
//               className={styles.thread}
//             >
//               <div className={styles.avatar}>
//                 {(question.author?.firstName || "U")[0]}
//               </div>

//               <div>
//                 <h3>{question.title}</h3>
//                 <p>{question.content}</p>
//                 <small>
//                   {question.author?.firstName || "Unknown"}{" "}
//                   {question.author?.lastName || ""} ·{" "}
//                   {question.answerCount || 0} replies
//                   {question.score ? ` · score ${question.score}` : ""}
//                 </small>
//               </div>
//             </Link>
//           ))}

//         {!loading && !message && questions.length > 0 && (
//           <div className={styles.pagination}>
//             <button
//               type="button"
//               className={styles.pageButton}
//               onClick={() => changePage(meta.page - 1)}
//               disabled={!canGoBack}
//             >
//               Previous
//             </button>

//             <span className={styles.pageInfo}>
//               Page {meta.page} of {meta.totalPages}
//             </span>

//             <button
//               type="button"
//               className={styles.pageButton}
//               onClick={() => changePage(meta.page + 1)}
//               disabled={!canGoForward}
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }
