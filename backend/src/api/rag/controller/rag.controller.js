
import path from "path";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../../../utils/errors/index.js";

import { embedQuery } from "../service/rag.service.js";
import {
  createDocumentFromUploadService,
  queryDocumentService,
  searchInDocumentService,
  getDocumentMetaService,
  assertOwnedDocument,
  listDocumentsService,
  deleteDocumentService,
} from "../service/rag.service.js";

export const createDocumentMulterErrorHandler = (error, req, res, next) => {
  if (error && error.name === "MulterError") {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? `File too large. Max ${process.env.RAG_MAX_UPLOAD_MB || 10}MB.`
        : error.message || "Invalid file upload.";

    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message,
    });
  }

  next(error);
};

export const createDocumentController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("PDF file is required.");
    }

    const document = await createDocumentFromUploadService({
      userId: req.user.id,
      file: req.file,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Document uploaded and processed.",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const queryDocumentController = async (req, res, next) => {
  try {
    // console.log("RAG QUERY START");

    const { documentId } = req.params;
    const { query } = req.body;

    // console.log("documentId:", documentId);
    // console.log("user:", req.user);
    // console.log("query:", query);

    const result = await queryDocumentService(
      Number(documentId),
      req.user.id, // ← FIXED
      query,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // console.error("❌ QUERY ERROR:", error);
    next(error);
  }
};

export const searchInDocumentController = async (req, res, next) => {
  try {
    const { query, k } = req.query;

    const data = await searchInDocumentService(
      req.params.documentId,
      req.user.id,
      query,
      Number(k || 5),
    );

    res.json({
      success: true,
      message: "Search results",
      data,
    });
  } catch (err) {
    next(err);
  }
};


const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads/rag");

export const getDocumentFileController = async (req, res, next) => {
  try {
    const doc = await assertOwnedDocument(req.params.documentId, req.user.id);

    const filePath = path.join(UPLOAD_ROOT, doc.storage_path);

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

export const getDocumentMetaController = async (req, res, next) => {
  try {
    const data = await getDocumentMetaService(
      req.params.documentId,
      req.user.id,
    );

    res.json({
      success: true,
      message: "Document fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};


export const deleteDocumentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const result = await deleteDocumentService(documentId, userId);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listDocumentsController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const docs = await listDocumentsService(userId);

    res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    next(error);
  }
};




