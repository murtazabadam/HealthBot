import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// NOTE FOR YOUR LOCAL PROJECT:
// Keep your regular imports (e.g., import Home from "./pages/Home";)
// The dummy components below are just to allow this preview environment to compile safely.

const Home = () => <div className="p-8 text-white">Home Page</div>;
const Login = () => <div className="p-8 text-white">Login Page</div>;
const Register = () => <div className="p-8 text-white">Register Page</div>;
const Chat = () => <div className="p-8 text-white">Chat Dashboard</div>;
const AuthCallback = () => <div className="p-8 text-white">Auth Callback</div>;
const VerifyEmail = () => <div className="p-8 text-white">Verify Email</div>;
const ForgotPassword = () => (
  <div className="p-8 text-white">Forgot Password</div>
);
const ResetPassword = () => (
  <div className="p-8 text-white">Reset Password</div>
);
const Profile = () => <div className="p-8 text-white">Profile Page</div>;

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/login" />}
        />

        {/* Protected Profile Route */}
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" />}
        />

        {/* Catch-all route to redirect unknown URLs back to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
