import crypto from "crypto";
import { safeExecute } from "../../../../db/config.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";

import {
  findSimilarQuestionsByQuestionId,
  findSimilarQuestionsByText,
  generateQuestionEmbedding,
  normalizeQuestionText,
  storeQuestionVector,
} from "./vector.service.js";

// Unique hash generator for question.
// This creates a random 16-character hexadecimal string.
// We use this hash in URLs instead of exposing the real database question_id.
const generateQuestionHash = () => crypto.randomBytes(8).toString("hex");

// Helper function to unwrap rows from mysql2 result.
// Sometimes safeExecute returns [rows, fields], so this gives us only rows.
const unwrapRows = (result) => {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0];
  }

  return result;
};

// Helper function to unwrap insert result.
// Insert queries return insertId, affectedRows, etc.
const unwrapInsertResult = (result) => {
  if (Array.isArray(result)) {
    return result[0];
  }

  return result;
};

export const createQuestionWithVectorService = async (payload) => {
  // Destructure payload to get userId, title, and content.
  const { userId, title, content } = payload;

  // Validate required fields before inserting into database.
  if (!userId || !title || !content) {
    throw new BadRequestError("userId, title, and content are required");
  }

  // Generate unique question hash using crypto module.
  // This hash serves as a public unique identifier for the question.
  const questionHash = generateQuestionHash();

  // Insert question into questions table.
  const insertQuestionSql = `
    INSERT INTO questions (question_hash, user_id, title, content)
    VALUES (?, ?, ?, ?)
  `;

  let questionResult;

  try {
    const insertResult = await safeExecute(insertQuestionSql, [
      questionHash,
      userId,
      title,
      content,
    ]);

    questionResult = unwrapInsertResult(insertResult);
  } catch (error) {
    // This error means the user_id does not exist in users table.
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw new BadRequestError("Invalid user ID. User does not exist.");
    }

    throw error;
  }

  // Get inserted question ID from database result.
  const questionId = questionResult.insertId;

  const createdQuestion = {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };

  // Normalize question text before generating vector embedding.
  // Usually this combines title + content into one clean text.
  const sourceText = normalizeQuestionText({
    title,
    content,
  });

  // Generate embedding using Gemini API and store vector in database.
  // Important: even if embedding fails, the question should still be created.
  try {
    const embeddingResult = await generateQuestionEmbedding(sourceText, {
      questionId,
    });

    if (
      !embeddingResult ||
      !Array.isArray(embeddingResult.embedding) ||
      embeddingResult.embedding.length === 0
    ) {
      throw new Error("Gemini API returned an empty embedding");
    }

    await storeQuestionVector({
      questionId,
      sourceText,
      embedding: embeddingResult.embedding,
      status: "ready",
    });
  } catch (error) {
    console.error("FAILED TO STORE VECTOR FOR QUESTION");
    console.error("Question ID:", questionId);
    console.error("Error:", error.message);

    // Save failed vector status for troubleshooting later.
    await storeQuestionVector({
      questionId,
      sourceText,
      embedding: [],
      status: "failed",
    }).catch((err) => {
      console.error("Failed to save failed vector status:", err.message);
    });
  }

  return createdQuestion;
};

// Build dynamic SQL query based on filters.
// This supports keyword search and "my questions only" filtering.
const buildQuestionFilters = (filters) => {
  const conditions = [];
  const params = [];

  // Search by title or content.
  if (filters.search) {
    conditions.push("(q.title LIKE ? OR q.content LIKE ?)");
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Filter only authenticated user's questions.
  if (filters.mine === true || filters.mine === "true") {
    conditions.push("q.user_id = ?");
    params.push(filters.userId);
  }

  return {
    whereClause:
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
};

export const getQuestionsService = async (filters = {}) => {
  // Get page and limit from filters.
  // If frontend does not send them, use default values.
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;

  // Offset means how many rows to skip.
  // Example: page 1 offset 0, page 2 offset 10.
  const offset = (page - 1) * limit;

  // Build WHERE clause and params based on search/mine filters.
  const { whereClause, params } = buildQuestionFilters(filters);

  // Main list query.
  // LIMIT and OFFSET use ? placeholders to avoid SQL errors.
  const listSql = `
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
    ${whereClause}
    GROUP BY q.question_id, u.user_id
    ORDER BY q.created_at DESC
    LIMIT ? OFFSET ?
  `;

  // Add limit and offset after dynamic params.
  // const result = await safeExecute(listSql, [...params,string( limit),string( offset)]);
  // const rows = unwrapRows(result);
  // const result = await safeExecute(listSql, [
  //   ...params,
  //   String(limit),
  //   String(offset),
  // ]);
  const result = await safeExecute(listSql, [
  ...params, 
  limit, 
  offset
]);
  const rows = unwrapRows(result);

  // Count total matching questions for the requested filters.
  const countSql = `
    SELECT COUNT(*) AS total
    FROM questions q
    ${whereClause}
  `;
  const countResult = await safeExecute(countSql, params);
  const countRows = unwrapRows(countResult);
  const total = Number(countRows[0]?.total || 0);

  // Format database rows for frontend.
  const data = rows.map((row) => ({
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
  }));

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      sortBy: "newest",
      sortOrder: "desc",
    },
  };
};

export const getSingleQuestionService = async ({ questionHash }) => {
  // Limit answers returned for one question.
  const answerLimit = 100;

  // Find question by public question_hash.
  const questionSql = `
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
    WHERE q.question_hash = ?
    GROUP BY q.question_id, u.user_id
  `;

  // const questionResult = await safeExecute(questionSql,[questionHash]);
  // const questionRows = unwrapRows(questionResult);
  const questionResult = await safeExecute(questionSql, [String(questionHash)]);
  const questionRows = unwrapRows(questionResult);
  // If no question found, throw 404 error.
  if (!questionRows.length) {
    throw new NotFoundError("Question not found");
  }

  const q = questionRows[0];

  // Fetch answers for this question.
  const answersSql = `
    SELECT
      a.answer_id AS id,
      a.content,
      a.created_at AS createdAt,
      a.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName
    FROM answers a
    JOIN users u ON u.user_id = a.user_id
    WHERE a.question_id = ?
    ORDER BY a.created_at ASC
    LIMIT ?
  `;

  // const answersResult = await safeExecute(answersSql,[q.id,String ( answerLimit)]);
  // const answerRows = unwrapRows(answersResult);
  const answersResult = await safeExecute(answersSql, [
    q.id,
    String(answerLimit),
  ]);
  const answersRows = unwrapRows(answersResult);
  // Format question data.
  const question = {
    id: q.id,
    questionHash: q.questionHash,
    title: q.title,
    content: q.content,
    answerCount: q.answerCount,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    author: {
      id: q.userId,
      firstName: q.firstName,
      lastName: q.lastName,
    },
  };

  // Format answers data.
  const answers = answerRows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
    },
  }));

  return {
    question,
    answers,
    answersMeta: {
      limit: answerLimit,
      total: answers.length,
    },
  };
};

export const searchQuestionsSemanticService = async ({
  query,
  k = 5,
  threshold = 0.75,
}) => {
  // Search similar questions by text using vector similarity.
  const results = await findSimilarQuestionsByText({
    text: query,
    k: Number(k),
    threshold: Number(threshold),
  });

  return {
    data: results,
    meta: {
      total: results.length,
      k: Number(k),
      threshold: Number(threshold),
      query,
      questionHash: null,
    },
  };
};

export const getSimilarQuestionsService = async ({
  questionHash,
  k = 5,
  threshold = 0.75,
}) => {
  // First find source question ID by question hash.
  const sourceSql = `
    SELECT question_id AS questionId
    FROM questions
    WHERE question_hash = ?
  `;

  // const sourceResult = await safeExecute(sourceSql, [questionHash]);
  const questionResult = await safeExecute(questionSql, [String(questionHash)]);
  const sourceRows = unwrapRows(sourceResult);

  // If source question does not exist, throw 404.
  if (!sourceRows.length) {
    throw new NotFoundError("Question not found");
  }

  // Find similar questions using vector similarity.
  const results = await findSimilarQuestionsByQuestionId({
    questionId: sourceRows[0].questionId,
    k: Number(k),
    threshold: Number(threshold),
  });

  return {
    data: results,
    meta: {
      total: results.length,
      k: Number(k),
      threshold: Number(threshold),
      query: null,
      questionHash,
    },
  };
};

