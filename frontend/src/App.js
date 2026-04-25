import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// --- LOCAL USERS: UNCOMMENT THESE IMPORTS AND DELETE THE MOCKS BELOW ---
// import Home from "./pages/home";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Chat from "./pages/Chat";
// import AuthCallback from './pages/AuthCallback';
// import ForgotPassword from './pages/ForgotPassword';

// --- MOCKS FOR PREVIEW ENVIRONMENT (Delete these in your local VS Code) ---
const Home = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Home Page (Preview Mock)
  </div>
);
const Login = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Login Page (Preview Mock)
  </div>
);
const Register = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Register Page (Preview Mock)
  </div>
);
const Chat = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Chat Interface (Preview Mock)
  </div>
);
const AuthCallback = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Auth Callback Processing...
  </div>
);
const ForgotPassword = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Forgot Password Page (Preview Mock)
  </div>
);

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Route: Forces users to log in before seeing the chat */}
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
