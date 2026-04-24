import React from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  MessageSquare,
  UserPlus,
  FileText,
  MapPin,
  Activity,
  ChevronRight,
  Shield,
  Clock,
  Brain,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  return (
    /* min-w-[1024px] is the magic class that forces the phone to display the laptop view! */
    <div className="min-h-screen bg-slate-950 font-sans text-slate-50 selection:bg-teal-500 selection:text-white min-w-[1024px] overflow-x-hidden relative">
      {/* Background Glow Orbs matching the image */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-12 py-5 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md fixed w-full top-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-7 w-7 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-10 text-sm font-medium text-slate-300">
          <a href="#home" className="text-teal-400 transition-colors">
            Home
          </a>
          <a href="#features" className="hover:text-teal-400 transition-colors">
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-teal-400 transition-colors"
          >
            How It Works
          </a>
          <a href="#about" className="hover:text-teal-400 transition-colors">
            About Us
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-md transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section - Centered Layout */}
      <main className="relative pt-44 pb-12 px-12 max-w-[1200px] mx-auto flex flex-col items-center text-center z-10">
        {/* Top Badge matching the photo */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-bold tracking-wider mb-6">
          <Activity size={14} />
          AI POWERED HEALTH ASSISTANT
        </div>

        {/* Heading on one line matching the photo */}
        <h1 className="text-5xl lg:text-[4rem] font-extrabold tracking-tight text-white mb-6 whitespace-nowrap">
          Your AI-Powered <span className="text-teal-400">Health</span>{" "}
          Assistant
        </h1>

        <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
          Get instant answers to your health questions, check symptoms, and
          receive smart, evidence-based recommendations – anytime, anywhere.
        </p>

        <div className="flex flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/chat"
            className="px-8 py-3.5 text-base font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all flex items-center gap-2"
          >
            <MessageSquare className="h-5 w-5" />
            Start Chatting
          </Link>
          <button className="px-8 py-3.5 text-base font-bold text-white border border-slate-600 hover:bg-slate-800 rounded-full transition-all flex items-center gap-2">
            Learn More
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Trust Badges (+ 24/7 Added) - Centered */}
        <div className="flex flex-row items-center justify-center gap-8 pt-8 border-t border-slate-800/50 w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-400" />
            <span className="text-sm font-medium text-slate-200">
              Secure & Private
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-slate-200">
              Instant Support
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-slate-200">
              AI-Powered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-400" />
            <span className="text-sm font-medium text-slate-200">
              24/7 Available
            </span>
          </div>
        </div>
      </main>

      {/* Features Section - Reduced bottom padding to close the gap */}
      <section
        id="features"
        className="pt-8 pb-8 px-12 relative z-20 max-w-[1400px] mx-auto"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Why Choose HealthBot?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Comprehensive healthcare assistance bridging the gap between
            patients and medical knowledge.
          </p>
        </div>

        {/* 4 Column Grid forced for all devices */}
        <div className="grid grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50 hover:border-teal-500/50 transition-all group">
            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-6 w-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              AI Symptom Checker
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Describe your symptoms naturally. Our advanced NLP engine analyzes
              patterns to suggest possible causes with confidence scores.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all group">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserPlus className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Smart Recommendations
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Receive severity-based advice indicating if you need emergency
              care, a routine checkup, or simple home self-care.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Health History
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Securely store and track your symptom history and past
              conversations to easily share with your healthcare provider.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50 hover:border-rose-500/50 transition-all group">
            <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MapPin className="h-6 w-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Nearby Facilities
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Integrated location services to instantly find the nearest
              hospitals, clinics, and emergency services when you need them.
            </p>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer Box moved UP to reduce the gap */}
      <div className="max-w-4xl mx-auto px-12 pb-12 w-full mt-4">
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-6 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h4 className="text-amber-500 font-bold uppercase text-sm tracking-widest">
              Appendix E: Medical Disclaimer
            </h4>
          </div>
          <p className="text-amber-500/80 text-sm leading-relaxed max-w-3xl mx-auto">
            This system provides preliminary health information only and is not
            a substitute for professional medical advice, diagnosis, or
            treatment. Always seek the advice of qualified health providers with
            any questions regarding medical conditions. Never disregard
            professional medical advice or delay seeking it because of
            information provided by this system.
          </p>
        </div>
      </div>

      {/* Footer structured: Logo above Copyright text */}
      <footer className="border-t border-slate-800/60 py-8 px-12 flex flex-col items-center justify-center w-full">
        {/* Logo at the top */}
        <div className="flex items-center gap-2 opacity-80 mb-4">
          <HeartPulse className="h-6 w-6 text-slate-300" />
          <span className="text-xl font-bold text-slate-300">HealthBot</span>
        </div>

        {/* Copyright text at the bottom */}
        <p className="text-slate-400 text-sm font-medium text-center">
          © Developed by Aarif Shameem, Junaid Nazeer, and Murtaza Badaam.
        </p>
      </footer>
    </div>
  );
}
