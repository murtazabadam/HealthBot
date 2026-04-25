import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  Calendar,
  Phone,
  Droplet,
  MapPin,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Email Verification State
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setErrorMessage("Google Sign Up is not connected to a backend yet.");
  };

  // Mock function to send OTP
  const handleSendOTP = () => {
    if (!email) {
      setErrorMessage("Please enter an email address first.");
      return;
    }
    setErrorMessage("");
    setOtpSent(true);
    setSuccessMessage(
      "A verification code has been sent to your email! (Use 1234 to test)",
    );
  };

  // Mock function to verify OTP
  const handleVerifyOTP = () => {
    if (otp === "1234") {
      // Mock OTP code for testing
      setEmailVerified(true);
      setOtpSent(false);
      setSuccessMessage("Email verified successfully!");
      setErrorMessage("");
    } else {
      setErrorMessage("Invalid verification code. Please try again.");
      setSuccessMessage("");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // 1. Check if email is verified
    if (!emailVerified) {
      setErrorMessage("You must verify your email address before registering.");
      return;
    }

    // 2. Check if terms are agreed
    if (!agreedToTerms) {
      setErrorMessage(
        "You must agree to the Terms of Service and Privacy Policy.",
      );
      return;
    }

    console.log("Registration submitted");
    navigate("/chat"); // Mock behavior: Takes you straight to the chat page
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 selection:bg-teal-500 selection:text-white relative flex flex-col items-center overflow-x-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:inline-block">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-transparent border border-teal-500 hover:bg-teal-500/10 rounded-md transition-all"
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* Main Register Container */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-10">
        {/* Glassmorphism Card */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-12 w-full max-w-[800px] shadow-[0_0_50px_rgba(13,148,136,0.1)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-6">
              <UserPlus className="h-8 w-8 text-teal-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-400 text-center text-sm sm:text-base leading-relaxed">
              Join <span className="text-teal-400 font-medium">HealthBot</span>{" "}
              and start your smarter health journey today.
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm p-3 rounded-lg text-center flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" /> {successMessage}
            </div>
          )}

          {/* Registration Form */}
          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            {/* Row 1: Name & Email Verification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address with Verification Button */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={emailVerified}
                      placeholder="Enter your email address"
                      required
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={emailVerified}
                    className={`px-4 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center gap-1 ${
                      emailVerified
                        ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 cursor-default"
                        : "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                    }`}
                  >
                    {emailVerified ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Verified
                      </>
                    ) : otpSent ? (
                      "Resend"
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>

                {/* OTP Input Field (Only shows when OTP is sent) */}
                {otpSent && !emailVerified && (
                  <div className="flex gap-2 mt-1 animate-in fade-in slide-in-from-top-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 4-digit code"
                      className="flex-1 bg-[#0B1120] border border-teal-500/50 rounded-lg py-2 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Passwords (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-tight">
                    Use at least 8 characters with a mix of letters, numbers &
                    symbols
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Age & Phone (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Age
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="number"
                    placeholder="Enter your age"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Gender, Blood Group, City (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Gender
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <select
                    defaultValue=""
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors appearance-none"
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Blood Group
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Droplet className="h-5 w-5 text-slate-500" />
                  </div>
                  <select
                    defaultValue=""
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors appearance-none"
                  >
                    <option value="" disabled>
                      Select blood group
                    </option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  City
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your city"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500 bg-[#0B1120]"
              />
              <label
                htmlFor="terms"
                className="text-sm text-slate-300 cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Main Sign Up Button with Gradient */}
            <button
              type="submit"
              className="w-full mt-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-semibold py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              Create Account <span className="text-xl leading-none">→</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-[1px] flex-1 bg-slate-700/50"></div>
            <span className="text-xs text-slate-500 font-medium">
              or continue with
            </span>
            <div className="h-[1px] flex-1 bg-slate-700/50"></div>
          </div>

          {/* Social Sign Up */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-3 bg-transparent border border-slate-700 hover:bg-slate-800 rounded-lg py-3.5 transition-colors text-sm font-semibold text-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center gap-3 z-10">
        <p className="text-slate-400 text-xs font-medium">
          © 2024 HealthBot. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link
            to="/privacy"
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-700">|</span>
          <Link
            to="/terms"
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
