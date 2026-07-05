import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Trash2, Loader2, Search, Sparkles } from "lucide-react";
import styles from "./RagDocuments.module.css";

// Fallback for RagAnswerBody if import fails
let RagAnswerBody;
try {
  // eslint-disable-next-line import/no-unresolved
  RagAnswerBody =
    require("../../components/RagAnswerBody/RagAnswerBody").default;
} catch {
  RagAnswerBody = ({ children }) => <div>{children}</div>;
}

// Fallback for speak if import fails
let speak;
try {
  // eslint-disable-next-line import/no-unresolved
  speak = require("../../accessibility/textToSpeech").speak;
} catch {
  speak = (text) => console.log("TTS:", text);
}

import {
  listDocuments,
  uploadPdf,
  deleteDocument,
  searchInDocument,
  queryDocument,
  fetchPdfObjectUrl,
} from "../../services/rag/rag.service.js";

export default function RagDocuments() {
  // ─── State ──────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [globalMessage, setGlobalMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [askQuery, setAskQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const fileInputRef = useRef(null);

  // ─── Derived State ──────────────────────────────────────────
  const selectedDocument = useMemo(
    () =>
      documents.find((doc) => String(doc.document_id) === String(selectedId)),
    [documents, selectedId],
  );

  // ─── Load Documents ─────────────────────────────────────────
  const loadDocuments = async (preferredId = null) => {
    setLoading(true);
    setGlobalMessage("");
    try {
      const result = await listDocuments();
      const list = result.data || [];
      setDocuments(list);
      if (preferredId) {
        setSelectedId(String(preferredId));
      } else if (!selectedId && list.length > 0) {
        setSelectedId(String(list[0].document_id));
      } else if (
        list.length > 0 &&
        selectedId &&
        !list.some((doc) => String(doc.document_id) === String(selectedId))
      ) {
        setSelectedId(String(list[0].document_id));
      }
    } catch (error) {
      setGlobalMessage(
        error.response?.data?.message ||
          error.message ||
          "Could not load documents.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Effects ────────────────────────────────────────────────
  useEffect(() => {
    loadDocuments();
  }, []);

  // Load PDF preview
  useEffect(() => {
    if (!selectedDocument || selectedDocument.status !== "ready") {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPreviewError("");
      return;
    }

    let canceled = false;
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewUrl(null);

    fetchPdfObjectUrl(selectedDocument.document_id)
      .then((blob) => {
        if (canceled) return;
        if (!blob || blob.size === 0) {
          throw new Error("Empty PDF received.");
        }
        if (blob.type && !blob.type.includes("pdf")) {
          throw new Error(`Received ${blob.type} instead of PDF.`);
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch((error) => {
        if (canceled) return;
        setPreviewError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load PDF preview.",
        );
      })
      .finally(() => {
        if (!canceled) setPreviewLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [selectedDocument]);

  // Revoke object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ─── Handlers ───────────────────────────────────────────────
  const handleSelectDocument = (documentId) => {
    setSelectedId(String(documentId));
    setAnswer("");
    setAnswerError("");
    setSearchResults([]);
    setSearchError("");
    setPreviewError("");
  };

  const openConfirm = (doc, e) => {
    e.stopPropagation();
    setConfirmTarget({ id: doc.document_id, title: doc.title });
    setConfirmOpen(true);
  };

  const closeConfirm = (e) => {
    if (e) e.stopPropagation();
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    setGlobalMessage("");
    try {
      const result = await uploadPdf(selectedFile);
      const newDoc = result.data;
      setSelectedFile(null);
      await loadDocuments(newDoc?.document_id);
      setAnswer("");
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      setUploadError(
        error.response?.data?.message ||
          error.message ||
          "Unable to upload PDF.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc, e) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete "${doc.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      await deleteDocument(doc.document_id);
      if (String(doc.document_id) === String(selectedId)) {
        setSelectedId(null);
        setAnswer("");
        setSearchResults([]);
        setPreviewUrl(null);
      }
      await loadDocuments();
    } catch (error) {
      setGlobalMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete document.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!askQuery.trim()) {
      setAnswerError("Please type a question to ask the PDF.");
      return;
    }
    if (!selectedDocument) return;
    setAnswerError("");
    setAnswer("");
    setAnswerLoading(true);
    try {
      const result = await queryDocument(
        selectedDocument.document_id,
        askQuery,
      );
      setAnswer(result.data?.answer || result.data || "No answer returned.");
    } catch (error) {
      setAnswerError(
        error.response?.data?.message ||
          error.message ||
          "Could not get an answer.",
      );
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a search phrase.");
      return;
    }
    if (!selectedDocument) return;
    setSearchError("");
    setSearchResults([]);
    setSearchLoading(true);
    try {
      const result = await searchInDocument(
        selectedDocument.document_id,
        searchQuery,
      );
      setSearchResults(result.data?.results || result.data || []);
    } catch (error) {
      setSearchError(
        error.response?.data?.message || error.message || "Search failed.",
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ─── Render ─────────────────────────────────────────────────
  try {
    return (
      <div className={styles.page}>
        <div className={styles.headerCard}>
          <p className={styles.eyebrow}>KNOWLEDGE BASE</p>
          <h1 className={styles.pageTitle}>Private PDF library</h1>
          <p className={styles.pageDesc}>
            Upload study or reference PDFs to your own workspace. Each file is
            indexed for semantic search and optional AI answers that cite
            passages from that document only. File size limits apply on the
            server; other users never see your uploads.
          </p>
        </div>

        {globalMessage && (
          <div className={styles.errorBanner}>{globalMessage}</div>
        )}

        <div className={styles.grid}>
          <aside className={styles.library}>
            <div className={styles.libraryHeader}>
              <strong>Library</strong>
              <p>Add PDFs here. Processing runs once per upload.</p>
            </div>

            <div className={styles.uploadZone}>
              <p className={styles.uploadHint}>
                Accepted format: PDF. Maximum file size is enforced by the
                server.
              </p>
              <div className={styles.uploadRow}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                <button
                  type="button"
                  className={styles.chooseBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <FileText size={14} /> Choose file
                </button>
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className={styles.spin} /> Uploading...
                    </>
                  ) : (
                    <>⬆ Upload</>
                  )}
                </button>
              </div>

              {selectedFile ? (
                <div className={styles.filePreview}>
                  <FileText size={14} className={styles.fileIcon} />
                  <span className={styles.fileName}>{selectedFile.name}</span>
                  <span className={styles.fileSize}>
                    {formatBytes(selectedFile.size)}
                  </span>
                </div>
              ) : (
                <p className={styles.noFile}>No file selected.</p>
              )}

              {uploadError && (
                <p className={styles.inlineError}>{uploadError}</p>
              )}
            </div>

            <div className={styles.docList}>
              {loading ? (
                <p className={styles.statusText}>Loading your library...</p>
              ) : documents.length === 0 ? (
                <p className={styles.statusText}>
                  Your library is empty. Upload a PDF to index it for search and
                  Q&A.
                </p>
              ) : (
                documents.map((doc) => {
                  const isSelected =
                    String(doc.document_id) === String(selectedId);
                  const isReady = doc.status === "ready";
                  return (
                    <button
                      type="button"
                      key={doc.document_id}
                      className={`${styles.docItem} ${
                        isSelected ? styles.docItemActive : ""
                      }`}
                      onClick={() => handleSelectDocument(doc.document_id)}
                    >
                      <div className={styles.docItemLeft}>
                        <span className={styles.docName}>{doc.title}</span>
                        <span
                          className={`${styles.badge} ${
                            isReady ? styles.badgeReady : styles.badgeProcessing
                          }`}
                        >
                          {isReady ? "READY" : "PROCESSING"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={(e) => handleDelete(doc, e)}
                        title="Delete document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className={styles.panel}>
            {!selectedDocument ? (
              <div className={styles.emptyPanel}>
                <p>
                  Choose a document from the library to open the reader, run
                  semantic search over its text, and ask questions with
                  AI-assisted answers grounded in that file.
                </p>
              </div>
            ) : selectedDocument.status !== "ready" ? (
              <div className={styles.emptyPanel}>
                <p>
                  This document is not ready for preview or AI tools. Current
                  status: <strong>{selectedDocument.status}</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* Reader */}
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Reader</h2>
                  <p className={styles.sectionDesc}>
                    Inline preview of the selected PDF.
                  </p>
                  <div className={styles.readerBox}>
                    {previewLoading ? (
                      <p className={styles.previewStatus}>
                        <Loader2 size={16} className={styles.spin} /> Loading
                        PDF preview...
                      </p>
                    ) : previewError ? (
                      <p className={styles.inlineError}>{previewError}</p>
                    ) : previewUrl ? (
                      <embed
                        key={previewUrl}
                        src={previewUrl}
                        type="application/pdf"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                          border: "none",
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                <hr className={styles.divider} />

                {/* Semantic Search */}
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Semantic search</h2>
                  <p className={styles.sectionDesc}>
                    Finds passages by meaning (embeddings), not only exact
                    keywords.
                  </p>
                  <label className={styles.fieldLabel}>Search query</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className={styles.textInput}
                    placeholder="Describe the topic or phrase you are looking for"
                  />
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={handleSearch}
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <Loader2 size={14} className={styles.spin} />
                    ) : (
                      <Search size={14} />
                    )}{" "}
                    Search
                  </button>

                  {searchError && (
                    <div className={styles.alertError}>{searchError}</div>
                  )}

                  {searchResults.length > 0 && (
                    <div className={styles.resultsList}>
                      {searchResults.map((item) => (
                        <article
                          key={item.chunkId}
                          className={styles.resultItem}
                        >
                          <p>{item.excerpt}</p>
                          <small>Score: {item.score?.toFixed(2)}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <hr className={styles.divider} />

                {/* Ask with AI */}
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Ask with AI</h2>
                  <p className={styles.sectionDesc}>
                    Answers use only retrieved excerpts from this PDF, with
                    citations where possible. When the document includes code,
                    the reply may show it in formatted blocks you can copy.
                  </p>
                  <label className={styles.fieldLabel}>Question</label>
                  <textarea
                    value={askQuery}
                    onChange={(e) => setAskQuery(e.target.value)}
                    className={styles.textarea}
                    rows={4}
                    placeholder="Ask a clear question in plain language. If the document does not cover it, the model should say so."
                  />
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={handleAsk}
                    disabled={answerLoading}
                  >
                    {answerLoading ? (
                      <Loader2 size={14} className={styles.spin} />
                    ) : (
                      <Sparkles size={14} />
                    )}{" "}
                    Ask
                  </button>

                  {answerError && (
                    <div className={styles.alertError}>{answerError}</div>
                  )}

                  {answer && (
                    <div className={styles.answerBox}>
                      <RagAnswerBody>{answer}</RagAnswerBody>
                      <button
                        type="button"
                        onClick={() => speak(answer)}
                        style={{
                          backgroundColor: "#0066FF",
                          color: "white",
                          border: "none",
                          padding: "4px 12px",
                          borderRadius: "4px",
                          marginTop: "10px",
                        }}
                      >
                        🔊 Read AI Answer
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {confirmOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.35)",
              zIndex: 60,
            }}
            onClick={closeConfirm}
          >
            <div
              style={{
                background: "var(--surface)" || "#fff",
                padding: 20,
                borderRadius: 8,
                minWidth: 320,
                boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p style={{ marginBottom: 12 }}>
                Delete "{confirmTarget?.title}"? This cannot be undone.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(confirmTarget, e);
                    closeConfirm();
                  }}
                  style={{ marginRight: 8 }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={closeConfirm}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("RagDocuments render error:", error);
    return (
      <div
        style={{
          padding: "2rem",
          margin: "2rem",
          border: "2px solid red",
          borderRadius: "8px",
          background: "#fff5f5",
        }}
      >
        <h2 style={{ color: "#b91c1c" }}>Something went wrong</h2>
        <p style={{ color: "#4a5568" }}>
          <strong>Error:</strong> {error.message}
        </p>
        <p style={{ color: "#4a5568" }}>
          Please check the console (F12) for more details.
        </p>
      </div>
    );
  }
}
