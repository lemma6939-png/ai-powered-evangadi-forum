import { body, param, query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

const documentIdValidation = param("documentId")
  .exists()
  .withMessage("documentId is required")
  .bail()
  .isInt({ gt: 0 })
  .withMessage("documentId must be a positive integer");

export const documentIdParamValidation = [
  documentIdValidation,
  validationErrorHandler,
];

export const queryDocumentValidation = [
  documentIdValidation,
  body("query")
    .exists()
    .withMessage("query is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("query cannot be empty"),
  validationErrorHandler,
];

export const searchDocumentValidation = [
  documentIdValidation,
  query("query")
    .exists()
    .withMessage("query is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("query cannot be empty"),
  query("k")
    .optional()
    .isInt({ gt: 0, lt: 101 })
    .withMessage("k must be a positive integer"),
  validationErrorHandler,
];
