
import { StatusCodes } from "http-status-codes";

import {
  createQuestionWithVectorService,
  getQuestionsService,
  getSingleQuestionService,
  searchQuestionsSemanticService,
  getSimilarQuestionsService,
} from "../service/question.service.js";

import {
  generateQuestionDraftCoachService,
  assessAnswerAgainstQuestionService,
} from "../service/genaiTextCoach.service.js";

// Controller for creating a new question.
// This endpoint needs authenticated user information from req.user.
export const createQuestionController = async (req, res, next) => {
  try {
    // Extract title and content from request body.
    const { title, content } = req.body;

    // Call service to create question and store vector embedding.
    const question = await createQuestionWithVectorService({
      userId: req.user.id,
      title,
      content,
    });

    // Send success response after question is created.
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question posted successfully.",
      data: question,
    });
  } catch (error) {
    // Pass error to error handling middleware.
    next(error);
  }
};

// Controller for getting/listing questions.
// For GET endpoint, we use query parameters, not body.
// Example: /api/questions?search=react&page=1&limit=10
export const getQuestionsController = async (req, res, next) => {
  try {
    // Build filters from query parameters.
    // Defaults protect us from "limit is not defined" errors.
    const filters = {
      search: req.query.search || "",
      mine: req.query.mine || "false",
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      userId: req.user?.id || null,
    };

    // Call service to fetch questions from database.
    const result = await getQuestionsService(filters);

    // Send questions and metadata to frontend.
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully.",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    // Pass error to error handling middleware.
    next(error);
  }
};

// Controller for getting one question by questionHash.
// This also returns answers for that question.
export const getSingleQuestionController = async (req, res, next) => {
  try {
    // Get questionHash from URL params.
    const result = await getSingleQuestionService({
      questionHash: req.params.questionHash,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question fetched successfully",
      question: result.question,
      answers: result.answers,
      answersMeta: result.answersMeta,
    });
  } catch (error) {
    next(error);
  }
};

// Controller for AI semantic question search.
// Example: /api/questions/search/semantic?query=react error&k=5
export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const result = await searchQuestionsSemanticService({
      query: req.query.query,
      k: req.query.k || 5,
      threshold: req.query.threshold || 0.75,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Semantic search completed successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

// Controller for getting similar questions by questionHash.
// Example: /api/questions/:questionHash/similar
export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const result = await getSimilarQuestionsService({
      questionHash: req.params.questionHash,
      k: req.query.k || 5,
      threshold: req.query.threshold || 0.75,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

// Controller for AI question draft coach.
// It helps improve the user's question before posting.
export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    // Extract draft title and content from body.
    const { title, content } = req.body;

    const result = await generateQuestionDraftCoachService({
      title,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Draft suggestions generated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller for AI answer fit check.
// It checks whether an answer matches a specific question.
export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    // Extract answer text from request body.
    const { answerText } = req.body;

    const result = await assessAnswerAgainstQuestionService({
      questionHash: req.params.questionHash,
      answerText,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer fit assessed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};







// import { StatusCodes } from "http-status-codes";

// import {
//   createQuestionWithVectorService,
//   getQuestionsService,
//   getSingleQuestionService,
//   searchQuestionsSemanticService,
//   getSimilarQuestionsService,
// } from "../service/question.service.js";

// import {
//   generateQuestionDraftCoachService,
//   assessAnswerAgainstQuestionService,
// } from "../service/genaiTextCoach.service.js";

// export const createQuestionController = async (req, res, next) => {
//   try {
//     //extract title and content from request body
//     const { title, content } = req.body;

//     const question = await createQuestionWithVectorService({
//       userId: req.user.id,
//       title,
//       content,
//     });

//     res.status(StatusCodes.CREATED).json({
//       success: true,
//       message: "Question posted successfully.",
//       data: question,
//     });
//   } catch (error) {
//     next(error);//pass error to error handling middleware
//   }
// };
// //for get endpoint we use query parameters not body.
// export const getQuestionsController = async (req, res, next) => {
//   try {
//     const filters = {
//       search: req.query.search || "",
//       mine: req.query.mine || "false",
//       page: Number(req.query.page) || 1,
//       limit: Number(req.query.limit) || 10,
//       userId: req.user?.id || null,
//     };

//     const result = await getQuestionsService(filters);

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Questions fetched successfully.",
//       data: result.data,
//       meta: result.meta,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//     const result = await getQuestionsService(filters);

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Questions fetched successfully.",
//       data: result.data,
//       meta: result.meta,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getSingleQuestionController = async (req, res, next) => {
//   try {
//     const result = await getSingleQuestionService({
//       questionHash: req.params.questionHash,
//     });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Question fetched successfully",
//       question: result.question,
//       answers: result.answers,
//       answersMeta: result.answersMeta,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const searchQuestionsSemanticController = async (req, res, next) => {
//   try {
//     const result = await searchQuestionsSemanticService({
//       query: req.query.query,
//       k: req.query.k || 5,
//       threshold: req.query.threshold || 0.75,
//     });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Semantic search completed successfully",
//       data: result.data,
//       meta: result.meta,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getSimilarQuestionsController = async (req, res, next) => {
//   try {
//     const result = await getSimilarQuestionsService({
//       questionHash: req.params.questionHash,
//       k: req.query.k || 5,
//       threshold: req.query.threshold || 0.75,
//     });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Similar questions fetched successfully",
//       data: result.data,
//       meta: result.meta,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const generateQuestionDraftCoachController = async (req, res, next) => {
//   try {
//     const { title, content } = req.body;

//     const result = await generateQuestionDraftCoachService({
//       title,
//       content,
//     });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Draft suggestions generated",
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const assessAnswerAgainstQuestionController = async (req, res, next) => {
//   try {
//     const { answerText } = req.body;

//     const result = await assessAnswerAgainstQuestionService({
//       questionHash: req.params.questionHash,
//       answerText,
//     });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Answer fit assessed",
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

