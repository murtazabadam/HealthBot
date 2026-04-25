import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/** * NOTE FOR LOCAL VS CODE:
 * To see your real designs (the navy/teal pages), you should:
 * 1. Use the REAL IMPORTS below.
 * 2. Delete the MOCK COMPONENTS at the bottom of this file.
 * * If you see a blank screen locally, check if your file names match
 * exactly (e.g., login.js vs Login.js).
 */

// --- REAL IMPORTS (Uncomment these in your local VS Code) ---
/*
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
*/

// --- MOCK COMPONENTS (Used here to prevent preview compilation errors) ---
// On your local computer, delete these lines to use your real page files!
const Home = () => (
  <div className="min-h-screen bg-[#0B1120] text-teal-400 flex flex-col items-center justify-center font-sans">
    <h1 className="text-4xl font-bold mb-4">HealthBot Home</h1>
    <p className="text-slate-400">
      Previewing routing... Visit /login or /register
    </p>
    <div className="flex gap-4 mt-6">
      <a
        href="/login"
        className="px-4 py-2 bg-teal-500 text-slate-900 rounded font-bold"
      >
        Login
      </a>
      <a
        href="/register"
        className="px-4 py-2 border border-teal-500 rounded font-bold"
      >
        Register
      </a>
    </div>
  </div>
);
const Login = () => (
  <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">
    Login Page
  </div>
);
const Register = () => (
  <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">
    Register Page
  </div>
);
const Chat = () => (
  <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">
    Chat Interface
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
