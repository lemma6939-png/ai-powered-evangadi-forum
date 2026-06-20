import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import upload from "../rag.upload.config.js";

import {
  documentIdParamValidation,
  queryDocumentValidation,
  searchDocumentValidation,
} from "../validation/rag.validation.js";

import {
  createDocumentMulterErrorHandler,
  createDocumentController,
  listDocumentsController,
  getDocumentMetaController,
  deleteDocumentController,
  getDocumentFileController,
  searchInDocumentController,
  queryDocumentController,
} from "../controller/rag.controller.js";

const router = express.Router();

/* ==========================================================================
   T-22 : Upload & Process RAG Document
   POST /api/rag/documents

   Flow:
   - Upload PDF file
   - Extract document text
   - Chunk content
   - Generate embeddings
   - Store metadata
   - Persist vectors for retrieval

   Auth: Required
========================================================================== */
router.post(
  "/documents",
  authenticateUser,
  upload.single("file"),
  createDocumentMulterErrorHandler,
  createDocumentController,
);

/* ==========================================================================
   T-24 : List User Documents
   GET /api/rag/documents

   Returns:
   - All documents uploaded by the authenticated user
   - Upload status and metadata

   Auth: Required
========================================================================== */
router.get("/documents", authenticateUser, listDocumentsController);

/* ==========================================================================
   T-24 : Retrieve Original Document File
   GET /api/rag/documents/:documentId/file

   Purpose:
   - Stream or download the original PDF file
   - Used by document preview screens

   Auth: Required
========================================================================== */
router.get(
  "/documents/:documentId/file",
  authenticateUser,
  documentIdParamValidation,
  getDocumentFileController,
);

/* ==========================================================================
   T-23 : Semantic Search Within Document
   GET /api/rag/documents/:documentId/search

   Query Params:
   - query : string

   Example:
   /documents/123/search?query=machine learning

   Returns:
   - Most relevant chunks
   - Matching document sections

   Auth: Required
========================================================================== */
router.get(
  "/documents/:documentId/search",
  authenticateUser,
  searchDocumentValidation,
  searchInDocumentController,
);

/* ==========================================================================
   T-23 : Ask Questions About Document (RAG)
   POST /api/rag/documents/:documentId/query

   Request Body:
   {
     "question": "What is reinforcement learning?"
   }

   Returns:
   - AI-generated answer
   - Context grounded in the document

   Auth: Required
========================================================================== */
router.post(
  "/documents/:documentId/query",
  authenticateUser,
  queryDocumentValidation,
  queryDocumentController,
);

/* ==========================================================================
   T-24 : Get Document Metadata
   GET /api/rag/documents/:documentId

   Returns:
   - documentId
   - filename
   - status
   - page count
   - chunk count
   - upload timestamp

   Auth: Required
========================================================================== */
router.get(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  getDocumentMetaController,
);

/* ==========================================================================
   T-24 : Delete Document
   DELETE /api/rag/documents/:documentId

   Removes:
   - Original PDF file
   - Document metadata
   - Chunks
   - Embeddings / vector records

   Auth: Required
========================================================================== */
router.delete(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  deleteDocumentController,
);

export default router;













