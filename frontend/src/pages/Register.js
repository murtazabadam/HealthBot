/* VERSION_CONTROL: 1.2.4_GENDER_FIX */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Calendar,
  Phone,
  Droplet,
  MapPin,
  ChevronDown,
} from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMessage(
        "You must agree to the Terms of Service and Privacy Policy.",
      );
      return;
    }
    // Validation passed - proceed to chat
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-slate-50 relative flex flex-col items-center overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation - Logo Only */}
      <nav className="flex items-center justify-start px-6 py-6 lg:px-12 w-full z-50">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </Link>
      </nav>

      {/* Main Registration Card */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 z-10 my-4 sm:my-10">
        <div className="bg-[#111827]/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-12 w-full max-w-[850px] shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

          <div className="flex flex-col items-center mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm px-4">
              Join HealthBot today and start your journey to better health.
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-6 sm:gap-8"
          >
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg text-center font-medium">
                {errorMessage}
              </div>
            )}

            {/* Row 1: REQUIRED (*) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300 flex gap-1">
                  Full Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300 flex gap-1">
                  Email Address{" "}
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Password (*) & Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300 flex gap-1">
                  Password <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Age & Phone (Non-mandatory) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300">
                  Age
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter your age"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Gender (*) & Others */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300 flex gap-1">
                  Gender <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                  {/* UPDATED: Male and Female only */}
                  <select
                    required
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-10 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="" disabled selected>
                      Select gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300">
                  Blood Group
                </label>
                <div className="relative">
                  <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                  <select className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-10 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer">
                    <option value="" disabled selected>
                      Select group
                    </option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Enter address"
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-5 w-5 rounded border-slate-700 bg-[#0B1120] text-teal-500 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-[10px] sm:text-xs text-slate-400 cursor-pointer"
              >
                I agree to the{" "}
                <span className="text-teal-400 font-medium hover:underline">
                  Terms & Privacy Policy
                </span>
                .
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-wide hover:brightness-110 transition-all"
            >
              Create Account →
            </button>

            {/* LOGIN LINK AT THE BOTTOM */}
            <div className="text-center pt-6 border-t border-slate-800/50">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-teal-400 font-extrabold hover:underline transition-all"
                >
                  Log In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      <footer className="pb-10 pt-4 opacity-40 flex flex-col items-center">
        <p className="text-[10px] text-slate-500">
          © 2026 HealthBot Project • V1.2.4 - GENDER FIX
        </p>
      </footer>
    </div>
  );
}
