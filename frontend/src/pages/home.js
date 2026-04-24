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
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-900 font-sans text-slate-50 selection:bg-teal-500 selection:text-white">
      {/* Navigation Bar - Forced Desktop Layout on Mobile */}
      <nav className="flex items-center justify-between px-4 py-4 lg:px-12 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md fixed w-full top-0 z-50 min-w-max">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer pr-4">
          <Activity className="h-6 w-6 lg:h-8 lg:w-8 text-teal-400" />
          <span className="text-xl lg:text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </div>

        {/* Navigation Links - Always Visible */}
        <div className="flex items-center gap-4 lg:gap-8 text-xs lg:text-sm font-medium text-slate-300">
          <a
            href="#home"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            Home
          </a>
          <a
            href="#features"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            About Us
          </a>
        </div>

        {/* Auth Buttons - Always Visible */}
        <div className="flex items-center gap-2 lg:gap-4 pl-4">
          <Link
            to="/login"
            className="px-2 py-2 text-xs lg:text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 lg:px-5 lg:py-2.5 text-xs lg:text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.5)] whitespace-nowrap"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section - Restored 50/50 Left/Right Split Layout */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Hero Left Content (Takes up the left half) */}
        <div className="flex-1 text-center lg:text-left z-10">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Your AI-Powered <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
              Health
            </span>{" "}
            Assistant
          </h1>

          <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Get instant answers to your health questions, check symptoms, and
            receive smart, evidence-based recommendations – anytime, anywhere.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-12">
            <Link
              to="/chat"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(45,212,191,0.4)]"
            >
              <MessageSquare className="h-5 w-5" />
              Start Chatting
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-full transition-all flex items-center justify-center gap-2">
              Learn More
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Trust Badges - Left Aligned */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8 border-t border-slate-800/50 w-full max-w-2xl">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-400" />
              <span className="text-sm font-medium text-slate-300">
                Secure & Private
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">
                Instant Support
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">
                AI-Powered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-400" />
              <span className="text-sm font-medium text-slate-300">
                24/7 Available
              </span>
            </div>
          </div>
        </div>

        {/* Hero Right Content - Empty Placeholder for Future Chatbot */}
        <div className="flex-1 relative w-full lg:min-h-[600px] hidden lg:block">
          {/* The right half is completely empty! You can paste the phone mockup back in here whenever you are ready. */}
        </div>
      </main>

      {/* Features Section - Now seamlessly dark mode! */}
      <section
        id="features"
        className="py-24 px-6 lg:px-12 relative z-20 border-t border-slate-800/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-white">
              Why Choose HealthBot?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Comprehensive healthcare assistance bridging the gap between
              patients and medical knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/40 rounded-3xl p-8 border border-slate-700 hover:shadow-2xl hover:border-teal-500/50 transition-all group backdrop-blur-sm">
              <div className="w-14 h-14 bg-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-7 w-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                AI Symptom Checker
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Describe your symptoms naturally. Our advanced NLP engine
                analyzes patterns to suggest possible causes with confidence
                scores.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/40 rounded-3xl p-8 border border-slate-700 hover:shadow-2xl hover:border-blue-500/50 transition-all group backdrop-blur-sm">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserPlus className="h-7 w-7 text-blue-400" />
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
            <div className="bg-slate-800/40 rounded-3xl p-8 border border-slate-700 hover:shadow-2xl hover:border-purple-500/50 transition-all group backdrop-blur-sm">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-purple-400" />
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
            <div className="bg-slate-800/40 rounded-3xl p-8 border border-slate-700 hover:shadow-2xl hover:border-rose-500/50 transition-all group backdrop-blur-sm">
              <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="h-7 w-7 text-rose-400" />
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
        </div>
      </section>

      {/* Mandatory Medical Disclaimer & Footer - Dark Mode */}
      <footer className="border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-2 opacity-50 mb-6">
            <HeartPulse className="h-6 w-6 text-slate-500" />
            <span className="text-xl font-bold text-slate-500">HealthBot</span>
          </div>

          <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-6 mb-8 max-w-3xl">
            <h4 className="text-amber-500 font-bold mb-2 uppercase text-sm tracking-wider">
              Appendix E: Medical Disclaimer
            </h4>
            <p className="text-amber-500/80 text-sm leading-relaxed">
              This system provides preliminary health information only and is
              not a substitute for professional medical advice, diagnosis, or
              treatment. Always seek the advice of qualified health providers
              with any questions regarding medical conditions. Never disregard
              professional medical advice or delay seeking it because of
              information provided by this system.
            </p>
          </div>

          {/* Cleaned up Footer Copyright */}
          <p className="text-slate-500 text-sm font-medium">
            © HealthBot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
