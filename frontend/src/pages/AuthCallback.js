import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const user = params.get("user");
    const error = params.get("error");

    if (error || !token) {
      console.error("OAuth error:", error);
      navigate("/login?error=oauth_failed");
      return;
    }

    try {
      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("user", decodeURIComponent(user));
      }
      navigate("/chat");
    } catch (err) {
      console.error("Auth callback error:", err);
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
        <p className="text-white text-lg">Signing you in...</p>
      </div>
    </div>
  );
}
