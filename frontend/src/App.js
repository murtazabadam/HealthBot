import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Uncomment these imports in your local VS Code environment!
// import Home from "./pages/home";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Chat from "./pages/Chat";
// import AuthCallback from './pages/AuthCallback';
// import ForgotPassword from './pages/ForgotPassword';

// Mock components for the preview environment to prevent compilation errors
const Home = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Home Page
  </div>
);
const Login = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Login Page
  </div>
);
const Register = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Register Page
  </div>
);
const Chat = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Chat Interface
  </div>
);
const AuthCallback = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Auth Callback Processing...
  </div>
);
const ForgotPassword = () => (
  <div className="min-h-screen bg-[#0B1120] text-white p-10 font-sans">
    Forgot Password Page
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
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
