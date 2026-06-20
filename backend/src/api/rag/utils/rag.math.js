import fs from "fs/promises";
import path from "path";

/**
 * Resolve absolute file path from storage_path
 */
export const resolveDocumentPath = (uploadRoot, storagePath) => {
  return path.resolve(uploadRoot, storagePath);
};

/**
 * Safe delete file (won’t crash if missing)
 */
export const safeDeleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
};

/**
 * Cosine similarity
 */
export const cosineSimilarity = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
