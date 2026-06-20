import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../../../../db/config.js";
import { ServiceUnavailableError } from "../../../utils/errors/index.js";

const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const RECOMMEND_THRESHOLD = Number(process.env.RECOMMEND_THRESHOLD) || 0.75;
const RECOMMEND_K = Number(process.env.RECOMMEND_K) || 5;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}
/**
 * Utility to collapse consecutive whitespace characters into a single space
 * and trim leading/trailing whitespace for consistent text formatting.
 *
 * @param {string} value - The input text to normalize.
 * @returns {string} The normalized text with collapsed whitespace and trimmed ends.
 */
const normalizeWhitespace = (value = "") => {
  return value.replace(/\s+/g, " ").trim();
};

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});
//utility function to unwrap database query results. Depending on the database driver, results may be nested in an array. This function normalizes the output to a single array of rows.
const unwrapRows = (result) => {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }
  return result;
};
/**
 * Normalize the question title by converting to lowercase, applying Unicode NFKC normalization,
 * and collapsing multiple whitespace characters into single spaces.
 * This ensures consistent text formatting for downstream tasks such as duplicate detection
 * and vector generation.
 *
 * @param {Object} input - An object containing the question title.
 * @param {string} input.title - The question title.
 * @returns {string} The normalized question text.
 */
//NKFC normalization to ensure consistent Unicode representation of text. This is important for accurate embedding generation and similarity calculations.

//normalize whitespace by replacing multiple spaces with a single space and trimming leading/trailing whitespace
// const normalizeWhitespace = (value = "") => {
//   return value.replace(/\s+/g, " ").trim();
// };
//normalize question text by combining title and content, normalizing whitespace, and converting to lowercase
export const normalizeQuestionText = ({ title = "", content = "" }) => {
  return normalizeWhitespace(`${title}\n\n${content}`)
    .normalize("NFKC")
    .toLowerCase();
};
/**
 * Calculate cosine similarity between two embedding vectors.
 *
 * @param {number[]} vectorA - First embedding vector.
 * @param {number[]} vectorB - Second embedding vector.
 * @returns {number} Similarity score between -1 and 1, typically 0 to 1 for embeddings.
 * @throws {Error} If vectors have different lengths.
 */
export const calculateCosineSimilarity = (vectorA, vectorB) => {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length !== vectorB.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

export const generateQuestionEmbedding = async (sourceText, options = {}) => {
  const { taskType = "RETRIEVAL_DOCUMENT" } = options;
  //RETRIEVAL_DOCUMENT	Embeddings optimized for document search.	Indexing articles, books, or web pages for search
  //generate embedding using Gemini API with error handling to ensure that any issues with the API call are caught and a meaningful error message is provided. This helps maintain the robustness of the application and allows for easier troubleshooting if embedding generation fails.
//retrieval_document is used for indexing content, while retrieval_query can be used for query embeddings to optimize similarity matching.
  try {
    const response = await ai.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: sourceText,
      config: {
        taskType,
        outputDimensionality: 768,
      },
    });

    const values = response?.embeddings?.[0]?.values;
//validate embeding before storage.
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Gemini API returned an empty embedding");
    }

    return {
      embedding: values,
      taskType,
    };
  } catch (error) {
    throw new ServiceUnavailableError(
      `Failed to generate question embedding: ${error.message}`,
    );
  }
};

export const storeQuestionVector = async ({
  questionId,
  sourceText,
  embedding,
  status = "ready",
}) => {
  //implement MYSQL insert....on duplicate key update for insert.
  const sql = `
    INSERT INTO question_vectors (question_id, source_text, embedding, status)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      source_text = VALUES(source_text),
      embedding = VALUES(embedding),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
  `;
//store the embedding in the database with the associated question ID and source text. 
  await safeExecute(sql, [
    questionId,
    sourceText,
    JSON.stringify(embedding || []),
    status,
  ]);
};

const parseEmbedding = (embeddingValue) => {
  if (Array.isArray(embeddingValue)) {
    return embeddingValue;
  }
//handle case where embedding is stored as a JSON string in the database. This ensures that the embedding can be correctly parsed back into an array format for similarity calculations. If the parsing fails, it returns an empty array to prevent errors in downstream processing.
  if (typeof embeddingValue === "string") {
    try {
      return JSON.parse(embeddingValue);
    } catch {
      return [];
    }
  }

  return [];
};
//helper function to retrieve question details for a list of question IDs. 
const getHydratedQuestionsByIds = async (questionIds = []) => {
  if (!questionIds.length) {
    return [];
  }

  const placeholders = questionIds.map(() => "?").join(",");

  const sql = `
    SELECT
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName,
      COUNT(DISTINCT a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON u.user_id = q.user_id
    LEFT JOIN answers a ON a.question_id = q.question_id
    WHERE q.question_id IN (${placeholders})
    GROUP BY q.question_id, u.user_id
  `;

  const result = await safeExecute(sql, questionIds);
  const rows = unwrapRows(result);

  const questionMap = new Map();

  rows.forEach((row) => {
    questionMap.set(row.id, {
      id: row.id,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      answerCount: row.answerCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
    });
  });

  return questionIds.map((id) => questionMap.get(id)).filter(Boolean);
};

const getReadyQuestionVectors = async ({ excludeQuestionId = null } = {}) => {
  let sql = `
    SELECT
      question_id AS questionId,
      embedding
    FROM question_vectors
    WHERE status = 'ready'
  `;

  const params = [];

  if (excludeQuestionId) {
    sql += " AND question_id != ?";
    params.push(excludeQuestionId);
  }

  const result = await safeExecute(sql, params);
  return unwrapRows(result);
};

const attachScoresToQuestions = async (scoredMatches) => {
  const ids = scoredMatches.map((item) => item.questionId);
  const questions = await getHydratedQuestionsByIds(ids);

  const scoreMap = new Map(
    scoredMatches.map((item) => [item.questionId, item.score]),
  );

  return questions.map((question) => ({
    ...question,
    score: Number(scoreMap.get(question.id).toFixed(6)),
  }));
};

export const findSimilarQuestionsByText = async ({
  text,
  k = RECOMMEND_K,
  threshold = RECOMMEND_THRESHOLD,
}) => {
  const embeddingResult = await generateQuestionEmbedding(text, {
    taskType: "RETRIEVAL_QUERY",
  });

  const vectors = await getReadyQuestionVectors();

  const scoredMatches = vectors
    .map((row) => ({
      questionId: row.questionId,
      score: calculateCosineSimilarity(
        embeddingResult.embedding,
        parseEmbedding(row.embedding),
      ),
    }))
    .filter((item) => item.score >= Number(threshold))
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(k));

  return attachScoresToQuestions(scoredMatches);
};

export const findSimilarQuestionsByQuestionId = async ({
  questionId,
  k = RECOMMEND_K,
  threshold = RECOMMEND_THRESHOLD,
}) => {
  const sourceSql = `
    SELECT embedding
    FROM question_vectors
    WHERE question_id = ? AND status = 'ready'
  `;

  const sourceResult = await safeExecute(sourceSql, [questionId]);
  const sourceRows = unwrapRows(sourceResult);

  if (!sourceRows.length) {
    return [];
  }

  const sourceEmbedding = parseEmbedding(sourceRows[0].embedding);
  const vectors = await getReadyQuestionVectors({
    excludeQuestionId: questionId,
  });

  const scoredMatches = vectors
    .map((row) => ({
      questionId: row.questionId,
      score: calculateCosineSimilarity(
        sourceEmbedding,
        parseEmbedding(row.embedding),
      ),
    }))
    .filter((item) => item.score >= Number(threshold))
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(k));

  return attachScoresToQuestions(scoredMatches);
};

export const getVectorConfig = () => ({
  model: GEMINI_EMBEDDING_MODEL,
  recommendThreshold: RECOMMEND_THRESHOLD,
  recommendK: RECOMMEND_K,
});
