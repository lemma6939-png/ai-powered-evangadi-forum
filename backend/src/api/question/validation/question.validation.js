import { body, param, query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

const questionHashValidation = param("questionHash")
  .matches(/^[a-f0-9]{16}$/)
  .withMessage(
    "Question hash must be a valid 16-character lowercase hex string",
  );

export const createQuestionValidation = [
  body("title") //title validation
    .trim()
    .notEmpty()
    .withMessage("Question title is required")
    .isString()
    .withMessage("Question title must be a string")
    .isLength({ min: 5, max: 255 })
    .withMessage("Question title must be between 5 and 255 characters"),

  body("content") //content validation
    .trim()
    .notEmpty()
    .withMessage("Question content is required")
    .isString()
    .withMessage("Question content must be a string")
    .isLength({ min: 10 })
    .withMessage("Question content must be at least 10 characters"),

  validationErrorHandler,
];

export const getQuestionsValidation = [
  query("search")
    .optional()
    .trim()
    .isString()
    .withMessage("Search must be a string"),

  query("mine")
    .optional()
    .isBoolean()
    .withMessage("Mine must be true or false")
    .toBoolean(),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be a positive integer")
    .toInt(),

  validationErrorHandler,
];
//questionHash validation for routes that require a questionHash parameter to ensure it is a valid 16-character hexadecimal string.
export const getSingleQuestionValidation = [
  questionHashValidation,
  validationErrorHandler,
];

export const searchQuestionsSemanticValidation = [
  query("query")
    .trim()
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ min: 5 })
    .withMessage("Search query must be at least 5 characters"),

  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be an integer between 1 and 20")
    .toInt(),

  query("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("threshold must be a number between 0 and 1")
    .toFloat(),

  validationErrorHandler,
];

export const getSimilarQuestionsValidation = [
  questionHashValidation,

  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be an integer between 1 and 20")
    .toInt(),

  query("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("threshold must be a number between 0 and 1")
    .toFloat(),

  validationErrorHandler,
];

export const generateQuestionDraftCoachValidation = [
  body("title")
    .optional()
    .trim()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Question content is required")
    .isString()
    .withMessage("Question content must be a string")
    .isLength({ min: 10 })
    .withMessage("Question content must be at least 10 characters"),

  validationErrorHandler,
];

export const assessAnswerAgainstQuestionValidation = [
  questionHashValidation,

  body("answerText")
    .trim()
    .notEmpty()
    .withMessage("Answer text is required")
    .isString()
    .withMessage("Answer text must be a string")
    .isLength({ min: 20 })
    .withMessage("Answer text must be at least 20 characters"),

  validationErrorHandler,
];
