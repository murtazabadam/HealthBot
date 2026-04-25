import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * NOTE FOR LOCAL DEVELOPMENT:
 * The Preview environment below cannot see your local files (Login.js, Register.js, etc.).
 * To make this code work in your local VS Code, you must:
 * 1. Uncomment the "REAL IMPORTS" block below.
 * 2. Delete the "MOCK COMPONENTS" block below.
 */

// --- 1. REAL IMPORTS (Uncomment these in VS Code) ---
/*
import Home from "./pages/home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
*/

// --- 2. MOCK COMPONENTS (Delete these in VS Code to see your real designs) ---
const Home = () => (
  <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center text-white p-10 font-sans">
    <h1 className="text-4xl font-bold mb-4 text-teal-400">HealthBot Home</h1>
    <p className="text-slate-400 text-center">
      Your local project is correctly routed to the Home Page.
    </p>
    <a
      href="/login"
      className="mt-6 px-6 py-2 bg-teal-500 rounded-lg font-bold"
    >
      Go to Login
    </a>
  </div>
);

const Login = () => (
  <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center text-white p-10 font-sans">
    <h1 className="text-4xl font-bold mb-4 text-teal-400">Login Page</h1>
    <p className="text-slate-400 text-center">
      Real component is located at: ./pages/Login.js
    </p>
    <div className="flex gap-4 mt-6">
      <a href="/register" className="text-teal-400">
        Register
      </a>
      <a href="/forgot-password" className="text-teal-400">
        Forgot Password?
      </a>
    </div>
  </div>
);

const Register = () => (
  <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">
    Registration Page
  </div>
);
const Chat = () => (
  <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">
    Chat Dashboard
  </div>
);
const AuthCallback = () => (
  <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">
    Authenticating...
  </div>
);
const ForgotPassword = () => (
  <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">
    Forgot Password Page
  </div>
);

function App() {
  // Check for authentication token
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
