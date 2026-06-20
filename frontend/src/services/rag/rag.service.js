import { apiClient } from "../core/api.client.js";

export const listDocuments = async () => {
  const response = await apiClient.get("/api/rag/documents");
  return response.data;
};

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/api/rag/documents", formData);

  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await apiClient.delete(`/api/rag/documents/${documentId}`);
  return response.data;
};

export const searchInDocument = async (documentId, query, k = 5) => {
  const response = await apiClient.get(
    `/api/rag/documents/${documentId}/search`,
    {
      params: { query, k },
    },
  );

  return response.data;
};

export const queryDocument = async (documentId, query) => {
  const response = await apiClient.post(
    `/api/rag/documents/${documentId}/query`,
    {
      query,
    },
  );

  return response.data;
};

export const fetchPdfObjectUrl = async (documentId) => {
  const response = await apiClient.get(
    `/api/rag/documents/${documentId}/file`,
    {
      responseType: "blob",
    },
  );

  return response.data;
};
