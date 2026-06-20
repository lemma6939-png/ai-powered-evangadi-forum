import { apiClient } from "../core/api.client.js";

export const getQuestions = async (params = {}) => {
  const response = await apiClient.get("/api/questions", {
    params,
  });

  return response.data;
};

export const getMyQuestions = async () => {
  const response = await apiClient.get("/api/questions", {
    params: {
      mine: true,
    },
  });

  return response.data;
};

export const searchQuestionsSemantic = async (query) => {
  const response = await apiClient.get("/api/questions/search", {
    params: {
      query,
      k: 5,
      threshold: 0.75,
    },
  });

  return response.data;
};

export const getQuestion = async (questionHash) => {
  const response = await apiClient.get(`/api/questions/${questionHash}`);

  return response.data;
};

export const getSimilarQuestions = async (questionHash) => {
  const response = await apiClient.get(
    `/api/questions/${questionHash}/similar`,
  );

  return response.data;
};

export const createQuestion = async (data) => {
  const response = await apiClient.post("/api/questions", data);

  return response.data;
};

export const draftCoach = async (data) => {
  const response = await apiClient.post("/api/questions/draft-coach", data);

  return response.data;
};
