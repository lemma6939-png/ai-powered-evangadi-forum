// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// export const embedQuery = async (text) => {
//   const res = await ai.models.embedContent({
//     model: "gemini-embedding-2",
//     contents: [text],
//     config: {
//       taskType: "RETRIEVAL_QUERY",
//     },
//   });

//   return res.embeddings[0].values;
// };
