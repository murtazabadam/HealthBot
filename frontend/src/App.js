import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home"; // <-- We added this!
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

import AuthCallback from './pages/AuthCallback';

// Add this route inside <Routes>:
<Route path="/auth/callback" element={<AuthCallback />} />

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* This now shows your beautiful new landing page! */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* This keeps your teammate's security for the chat page */}
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
