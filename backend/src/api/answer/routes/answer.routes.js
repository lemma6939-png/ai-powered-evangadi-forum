import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { createAnswerValidation } from "../validation/answer.validation.js";
import { createAnswerController } from "../controller/answer.controller.js";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  createAnswerValidation,
  createAnswerController,
);

export default router;
