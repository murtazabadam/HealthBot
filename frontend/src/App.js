import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Importing your actual pages!
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";

// --- GLOBAL AUTO-LOGOUT INTERCEPTOR ---
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// --- DYNAMIC PROTECTED ROUTE (Requires Login) ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

// --- DYNAMIC PUBLIC ROUTE (Hides pages if already logged in) ---
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/chat" replace /> : children;
};

function App() {
  // WAKE UP BACKEND ON APP LOAD
  useEffect(() => {
    // Ping backend on app load to wake it up before user tries to login
    fetch("https://healthbot-backend-ezxv.onrender.com/")
      .then(() => console.log("Backend is awake"))
      .catch(() => console.log("Backend waking up..."));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES - Redirects to Chat if already logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* STANDARD ROUTES */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* PROTECTED ROUTE (Your mega dashboard!) */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route to redirect unknown URLs back to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
