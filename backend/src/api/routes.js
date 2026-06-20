import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import questionsRoutes from "./question/routes/question.routes.js";
import answersRoutes from "./answer/routes/answer.routes.js";
import ragRoutes from "./rag/routes/rag.routes.js";

const mainRouter = express.Router();

//api/auth
mainRouter.use("/auth", authRoutes);

//api/questions
mainRouter.use("/questions", questionsRoutes);

//api/answers
mainRouter.use("/answers", answersRoutes);

//api/rag
mainRouter.use("/rag", ragRoutes);

export default mainRouter;
