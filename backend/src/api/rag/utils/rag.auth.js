import { safeExecute } from "../../../../db/config.js";
import { NotFoundError } from "../../../utils/errors/index.js";

export const assertOwnedDocument = async (documentId, userId) => {
  const sql = `
    SELECT * FROM documents
    WHERE document_id = ? AND user_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [documentId, userId]);

  if (!rows.length) {
    throw new NotFoundError("Document not found");
  }

  return rows[0];
};
