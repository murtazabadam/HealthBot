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
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback"; // <-- NEW IMPORT ADDED HERE

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

// --- DYNAMIC ROUTE PROTECTOR ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const token = localStorage.getItem("token");

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
        {/* If logged in, skip Home and go straight to Chat */}
        <Route
          path="/"
          element={token ? <Navigate to="/chat" replace /> : <Home />}
        />

        {/* If logged in, prevent them from seeing the Login/Register screens */}
        <Route
          path="/login"
          element={token ? <Navigate to="/chat" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/chat" replace /> : <Register />}
        />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* NEW: Google OAuth Callback Route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Chat Route */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Protected Profile Route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
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
