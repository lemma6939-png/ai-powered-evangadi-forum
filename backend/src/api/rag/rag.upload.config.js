import fs from "fs";
import path from "path";
import multer from "multer";

const RAG_UPLOAD_DIR = process.env.RAG_UPLOAD_DIR || "uploads/rag";
const RAG_MAX_UPLOAD_MB = Number(process.env.RAG_MAX_UPLOAD_MB) || 10;
const maxSizeBytes = RAG_MAX_UPLOAD_MB * 1024 * 1024;

const uploadRoot = path.resolve(process.cwd(), RAG_UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id ? String(req.user.id) : "anonymous";
    const userDir = path.join(uploadRoot, userId);
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMime = file.mimetype === "application/pdf";
  const allowedExt =
    path.extname(file.originalname || "").toLowerCase() === ".pdf";

  // Debug logging for upload issues
  try {
    console.log("[RAG] upload fileFilter:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      allowedExt,
      allowedMime,
    });
  } catch (e) {
    // ignore logging errors
  }

  // Some browsers/clients may send non-standard mimetypes (eg. application/octet-stream)
  // so primarily validate by file extension and fall back to mimetype when available.
  if (allowedExt || allowedMime) {
    return cb(null, true);
  }

  const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
  err.message = `Only PDF files are allowed. Received: ${file.originalname} (${file.mimetype})`;
  cb(err);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeBytes },
});

export default upload;
