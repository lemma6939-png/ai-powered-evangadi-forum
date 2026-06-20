import { apiClient } from "../core/api.client";

export const answerService = {
  async createAnswer(data) {
    const res = await apiClient.post("/api/answers", data);
    return res.data;
  },

  async answerFit(questionHash, answerText) {
    const res = await apiClient.post(
      `/api/questions/${questionHash}/answer-fit`,
      { answerText },
    );
    return res.data;
  },
};
