import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const createAnswerValidation = [
  body("questionId")
    .notEmpty()
    .withMessage("Question ID is required")
    .isInt({ min: 1 })
    .withMessage("Question ID must be a valid number")
    .toInt(),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Answer content is required")
    .isLength({ min: 10 })
    .withMessage("Answer content must be at least 10 characters"),

  validationErrorHandler,
];
