import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// These are your REAL files located in your pages folder!
import Home from "./pages/home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  // Checks for the token in your browser's local storage
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Route: Redirects to Login if no token is found */}
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/login" />}
        />

        {/* Fallback: Redirect any unknown URL to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
