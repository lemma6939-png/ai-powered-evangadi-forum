import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";

import {
  createQuestionController,
  getQuestionsController,
  searchQuestionsSemanticController,
  generateQuestionDraftCoachController,
  getSimilarQuestionsController,
  assessAnswerAgainstQuestionController,
  getSingleQuestionController,
} from "../controller/question.controller.js";

import {
  createQuestionValidation,
  getQuestionsValidation,
  searchQuestionsSemanticValidation,
  generateQuestionDraftCoachValidation,
  getSimilarQuestionsValidation,
  assessAnswerAgainstQuestionValidation,
  getSingleQuestionValidation,
} from "../validation/question.validation.js";

//create router
const router = express.Router();

router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);
//get all questions with optional search and mine filter for fetching only the authenticated user's questions.
/**
 * @route GET /api/questions
 * @desc Get all questions with optional search/mine filter
 * @access Protected
 */ 
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

router.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

router.get(
  "/:questionHash/similar",
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

export default router;




// Here are the backend endpoints we built for Milestone #2:

// POST /api/questions

// Create question + auto embedding.

// GET /api/questions

// List all questions.

// GET /api/questions?mine=true

// List only my questions.

// GET /api/questions/:questionHash

// Get single question details + answers.

// GET /api/questions/search?query=react express&k=5&threshold=0.5

// Semantic AI search.

// GET /api/questions/:questionHash/similar

// Find similar questions.

// POST /api/answers

// Create answer.

// POST /api/questions/draft-coach

// AI question draft coach.

// POST /api/questions/:questionHash/answer-fit

// AI answer fit evaluation.
