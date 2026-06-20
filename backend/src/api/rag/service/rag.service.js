import fs from "fs/promises";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { db, safeExecute } from "../../../../db/config.js";
import {
  BadRequestError,
  ServiceUnavailableError,
  NotFoundError,
} from "../../../utils/errors/index.js";
import { createRequire } from "module";

import { cosineSimilarity } from "../utils/rag.math.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash-lite";
const DEFAULT_CHUNK_CHARS = Number(process.env.RAG_CHUNK_CHARS) || 1000;
const DEFAULT_CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP) || 150;
const MAX_CHUNKS_PER_DOC = Number(process.env.RAG_MAX_CHUNKS_PER_DOC) || 1000;
const MIN_TEXT_CHARS = Number(process.env.RAG_MIN_TEXT_CHARS) || 50;
const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.RAG_UPLOAD_DIR || "uploads/rag",
);

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim();

const chunkText = (text, chunkSize, overlap) => {
  const normalized = normalizeText(text);
  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const content = normalized.slice(start, end);

    chunks.push({
      chunkIndex: index++,
      content,
      pageStart: null,
      pageEnd: null,
    });

    if (end === normalized.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
};


export const embedQuery = async (text) => {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: [text],
  });

  return response.embeddings[0].values;
};
// pdrf upload
// pdf parse
//chunk
//embed(gemni)
//store vectors(documents table,document_chunks,document_chunk_vectors)

export const createDocumentFromUploadService = async ({ userId, file }) => {
  const fileBuffer = await fs.readFile(file.path);
  const pdf = await pdfParse(fileBuffer);
  const rawText = String(pdf.text || "").trim();

  if (rawText.length < MIN_TEXT_CHARS) {
    throw new BadRequestError(
      `Uploaded PDF did not contain enough readable text. Minimum ${MIN_TEXT_CHARS} characters required.`,
    );
  }

  const storagePath = path.relative(UPLOAD_ROOT, file.path).replace(/\\/g, "/");
  const insertDocSql = `
    INSERT INTO documents
      (user_id, title, mime_type, storage_path, byte_size, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const insertResult = await safeExecute(insertDocSql, [
    userId,
    file.originalname,
    file.mimetype,
    storagePath,
    file.size,
    "processing",
  ]);

  const documentId = insertResult.insertId;
  const chunks = chunkText(rawText, DEFAULT_CHUNK_CHARS, DEFAULT_CHUNK_OVERLAP);

  if (chunks.length === 0) {
    await safeExecute(
      "UPDATE documents SET status = ?, error_message = ? WHERE document_id = ?",
      ["failed", "Unable to chunk document text.", documentId],
    );
    throw new BadRequestError("Unable to chunk document text.");
  }

  if (chunks.length > MAX_CHUNKS_PER_DOC) {
    const message = `Document has ${chunks.length} chunks, which exceeds the allowed limit of ${MAX_CHUNKS_PER_DOC}.`;
    await safeExecute(
      "UPDATE documents SET status = ?, error_message = ? WHERE document_id = ?",
      ["failed", message, documentId],
    );
    throw new BadRequestError(
      `Document has too much text to process. Maximum ${MAX_CHUNKS_PER_DOC} chunks allowed.`,
    );
  }

  const chunkContents = chunks.map((chunk) => chunk.content);
  console.log(
    `[RAG] Generated ${chunks.length} chunks for document ${documentId}`,
  );

  let embeddings;
  try {
    embeddings = await generateEmbeddings(chunkContents);
    console.log(`[RAG] Generated ${embeddings.length} embeddings`);

    if (!embeddings || embeddings.length === 0) {
      throw new Error("Embeddings array is empty or undefined");
    }
    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embeddings count (${embeddings.length}) does not match chunks count (${chunks.length})`,
      );
    }
  } catch (embeddingError) {
    console.error("[RAG] Embedding generation failed:", embeddingError);
    await safeExecute(
      "UPDATE documents SET status = ?, error_message = ? WHERE document_id = ?",
      ["failed", `Embedding error: ${embeddingError.message}`, documentId],
    );
    throw embeddingError;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    console.log(`[RAG] Started transaction for document ${documentId}`);

    const insertChunkSql = `
      INSERT INTO document_chunks
        (document_id, chunk_index, content, page_start, page_end)
      VALUES (?, ?, ?, ?, ?)
    `;

    const insertVectorSql = `
      INSERT INTO document_chunk_vectors
        (chunk_id, source_text, embedding)
      VALUES (?, ?, ?)
    `;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      if (!embedding) {
        throw new Error(`Missing embedding for chunk ${i}`);
      }

      const [chunkResult] = await connection.execute(insertChunkSql, [
        documentId,
        chunk.chunkIndex,
        chunk.content ?? "",
        chunk.pageStart ?? null,
        chunk.pageEnd ?? null,
      ]);

      const chunkId = chunkResult.insertId;
      console.log(`[RAG] Inserted chunk ${i} with ID ${chunkId}`);

      await connection.execute(insertVectorSql, [
        chunkId,
        chunk.content ?? "",
        JSON.stringify(embedding),
      ]);
      console.log(`[RAG] Inserted vector for chunk ${chunkId}`);
    }

    await connection.commit();
    console.log(`[RAG] Committed transaction for document ${documentId}`);

    await safeExecute(
      "UPDATE documents SET status = ?, error_message = NULL WHERE document_id = ?",
      ["ready", documentId],
    );
  } catch (error) {
    console.error(`[RAG] Transaction error for document ${documentId}:`, error);
    try {
      await connection.rollback();
    } catch (rbErr) {
      console.error("[RAG] Rollback failed:", rbErr);
    }

    await safeExecute(
      "UPDATE documents SET status = ?, error_message = ? WHERE document_id = ?",
      ["failed", `Transaction error: ${error.message}`, documentId],
    );

    throw error;
  } finally {
    try {
      await connection.release();
    } catch (releaseErr) {
      // ignore release errors
    }
  }
};

export const searchInDocumentService = async (
  documentId,
  userId,
  query,
  k = 5,
) => {
  await assertOwnedDocument(documentId, userId);

  const queryVector = await embedQuery(query);

  const rows = await safeExecute(
    `SELECT c.chunk_id, c.chunk_index, c.content, v.embedding
     FROM document_chunks c
     JOIN document_chunk_vectors v ON v.chunk_id = c.chunk_id
     WHERE c.document_id = ?`,
    [documentId],
  );

  const scored = rows.map((r) => {
    const vec =
      typeof r.embedding === "string" ? JSON.parse(r.embedding) : r.embedding;

    return {
      chunkId: r.chunk_id,
      chunkIndex: r.chunk_index,
      excerpt: r.content,
      score: cosineSimilarity(queryVector, vec),
    };
  });

  return {
    query,
    results: scored.sort((a, b) => b.score - a.score).slice(0, k),
  };
};


export const queryDocumentService = async (
  documentId,
  userId,
  query,
  k = 5,
) => {
  await assertOwnedDocument(documentId, userId);

  // Generate embedding for the user's question
  const queryVector = await embedQuery(query);

  // Get all chunks and embeddings for this document
  const rows = await safeExecute(
    `
      SELECT
        c.chunk_id,
        c.chunk_index,
        c.content,
        v.embedding
      FROM document_chunks c
      JOIN document_chunk_vectors v
        ON v.chunk_id = c.chunk_id
      WHERE c.document_id = ?
    `,
    [documentId],
  );

  // Calculate similarity scores
const scored = rows.map((r) => {
  // console.log("Embedding type:", typeof r.embedding);

  const vec =
    typeof r.embedding === "string" ? JSON.parse(r.embedding) : r.embedding;

  return {
    chunkId: r.chunk_id,
    chunkIndex: r.chunk_index,
    excerpt: r.content,
    score: cosineSimilarity(queryVector, vec),
  };
});

  // Get top matching chunks
  const top = scored.sort((a, b) => b.score - a.score).slice(0, k);

  // Build context for Gemini
  const context = top
    .map((t) => `Chunk ${t.chunkIndex}:\n${t.excerpt}`)
    .join("\n\n");

  const prompt = `
You are an assistant that answers user questions using ONLY the provided document context.

If the answer is not found in the context, respond with:
"Sorry, I don't know the answer to that question my answer is dependent on the given document thank you for understanding".



Context:
${context}

Question:
${query}

Answer:
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });

    const answerText = response.text || "";

    return {
      answer: answerText,
      citations: top.map((t) => ({
        ref: t.chunkId,
        chunkIndex: t.chunkIndex,
      })),
      chunksUsed: top.map((t) => t.chunkId),
    };
  } catch (err) {
    throw new ServiceUnavailableError(
      `Failed to generate answer: ${err.message}`,
    );
  }
};




export const getDocumentMetaService = async (documentId, userId) => {
  const doc = await assertOwnedDocument(documentId, userId);

  return doc;
};

export const listDocumentsService = async (userId) => {
  const sql = `
    SELECT document_id, title, mime_type, byte_size,
           status, created_at, updated_at
    FROM documents
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  return await safeExecute(sql, [userId]);
};

export const assertOwnedDocument = async (documentId, userId) => {
  const sql = `
    SELECT * FROM documents
    WHERE document_id = ? AND user_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [documentId, userId]);

  if (!rows || rows.length === 0) {
    throw new NotFoundError("Document not found.");
  }

  return rows[0];
};
export const generateEmbeddings = async (texts) => {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,
  });

  return response.embeddings.map((e) => e.values);
};