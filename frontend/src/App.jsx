import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Auth from "./pages/Auth/Auth";
import Dashboard from "./pages/Dashboard/Dashboard";
import Landing from "./pages/Landing/Landing";
import PostQuestion from "./pages/PostQuestion/PostQuestion";
import MyQuestions from "./pages/MyQuestions/MyQuestions";
import QuestionDetail from "./pages/QuestionDetail/QuestionDetail";
import RagDocuments from "./pages/RagDocuments/RagDocuments";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          <Route element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/questions/ask"
              element={
                <ProtectedRoute>
                  <PostQuestion />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-questions"
              element={
                <ProtectedRoute>
                  <MyQuestions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/questions/:questionHash"
              element={
                <ProtectedRoute>
                  <QuestionDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rag-documents"
              element={
                <ProtectedRoute>
                  <RagDocuments />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
