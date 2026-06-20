import { safeExecute } from "../../../../db/config.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";

const unwrapRows = (result) => {
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
  return result;
};

const unwrapInsertResult = (result) => {
  if (Array.isArray(result)) return result[0];
  return result;
};

export const createAnswerService = async ({ userId, questionId, content }) => {
  const questionSql = `
    SELECT 
      question_id AS questionId,
      question_hash AS questionHash,
      user_id AS authorId
    FROM questions
    WHERE question_id = ?
  `;

  const questionResult = await safeExecute(questionSql, [questionId]);
  const questionRows = unwrapRows(questionResult);

  if (!questionRows.length) {
    throw new NotFoundError("Question not found");
  }

  const question = questionRows[0];

  if (Number(question.authorId) === Number(userId)) {
    throw new BadRequestError("You cannot answer your own question");
  }

  const insertSql = `
    INSERT INTO answers (question_id, user_id, content)
    VALUES (?, ?, ?)
  `;

  const insertResult = await safeExecute(insertSql, [
    question.questionId,
    userId,
    content,
  ]);

  const result = unwrapInsertResult(insertResult);

  return {
    id: result.insertId,
    questionId: question.questionId,
    questionHash: question.questionHash,
    content,
    userId,
  };
};
