import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Clock,
  Brain,
  HeartPulse,
  MessageSquare,
  UserPlus,
  FileText,
  MapPin,
  Activity,
  Send,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-50 selection:bg-teal-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md fixed w-full top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer">
          <Activity className="h-8 w-8 text-teal-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            HealthBot
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#home" className="hover:text-teal-400 transition-colors">
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

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.5)]"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Hero Left Content */}
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

          <div className="flex items-center justify-center lg:justify-start gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">
                JD
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">
                SM
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">
                AK
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">
                +
              </div>
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-white font-semibold">
                Trusted by 10,000+
              </span>{" "}
              users <br />
              <span className="text-yellow-400">★★★★★</span>
            </div>
          </div>
        </div>

        {/* Hero Right Visuals (Floating UI) */}
        <div className="flex-1 relative w-full max-w-lg lg:max-w-none mx-auto mt-10 lg:mt-0">
          {/* Main Phone Mockup */}
          <div className="relative mx-auto w-[280px] sm:w-[320px] h-[600px] bg-slate-950 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden z-20 flex flex-col">
            {/* Phone Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto" />

            {/* Chat App Header */}
            <div className="pt-10 pb-4 px-4 border-b border-slate-800/50 flex items-center gap-3">
              <Activity className="h-5 w-5 text-teal-400" />
              <span className="font-semibold text-sm">HealthBot AI</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 flex flex-col gap-4 text-sm overflow-hidden">
              <div className="flex gap-2 items-end">
                <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-3 w-3 text-slate-900" />
                </div>
                <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-bl-sm max-w-[80%]">
                  Hello! I'm HealthBot. How can I help you today?
                </div>
              </div>

              <div className="flex gap-2 items-end justify-end">
                <div className="bg-teal-500 text-slate-900 p-3 rounded-2xl rounded-br-sm max-w-[80%] font-medium">
                  I have a headache and a mild fever. What should I do?
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-3 w-3 text-slate-900" />
                </div>
                <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-bl-sm max-w-[85%]">
                  <p className="mb-2">
                    Based on your symptoms, it might be a common cold or flu.
                    Here are some preliminary recommendations:
                  </p>
                  <ul className="space-y-1 text-slate-300 text-xs">
                    <li className="flex items-center gap-1">
                      <span className="text-teal-400">✓</span> Rest and stay
                      hydrated
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="text-teal-400">✓</span> Take paracetamol
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="text-teal-400">✓</span> Monitor your
                      temperature
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-slate-400">
                    If symptoms persist, consult a doctor.
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-800/50">
              <div className="bg-slate-900 rounded-full flex items-center px-4 py-2 border border-slate-700">
                <span className="text-slate-500 text-xs flex-1">
                  Type your symptoms...
                </span>
                <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center">
                  <Send className="h-3 w-3 text-slate-900 ml-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Badges (Hidden on very small screens) */}
          <div className="hidden sm:flex absolute top-20 -left-12 bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl shadow-xl items-start gap-3 z-30 animate-[bounce_4s_infinite]">
            <Shield className="h-6 w-6 text-teal-400 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-white">Secure & Private</h4>
              <p className="text-xs text-slate-400">100% Data Protection</p>
            </div>
          </div>

          <div className="hidden sm:flex absolute bottom-32 -left-16 bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl shadow-xl items-start gap-3 z-30 animate-[bounce_5s_infinite_0.5s]">
            <Clock className="h-6 w-6 text-blue-400 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-white">Instant Support</h4>
              <p className="text-xs text-slate-400">Real-time answers</p>
            </div>
          </div>

          <div className="hidden sm:flex absolute top-40 -right-12 bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl shadow-xl items-start gap-3 z-30 animate-[bounce_6s_infinite_1s]">
            <Brain className="h-6 w-6 text-purple-400 mt-1" />
            <div>
              <h4 className="text-sm font-bold text-white">AI-Powered</h4>
              <p className="text-xs text-slate-400">Smart NLP Engine</p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section (White Background) */}
      <section
        id="features"
        className="bg-white text-slate-900 py-24 px-6 lg:px-12 rounded-t-[3rem] lg:rounded-t-[5rem] relative z-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Why Choose HealthBot?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Comprehensive healthcare assistance bridging the gap between
              patients and medical knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-teal-100 transition-all group">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-7 w-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Symptom Checker</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Describe your symptoms naturally. Our advanced NLP engine
                analyzes patterns to suggest possible causes with confidence
                scores.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all group">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserPlus className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Recommendations</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Receive severity-based advice indicating if you need emergency
                care, a routine checkup, or simple home self-care.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-purple-100 transition-all group">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Health History</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Securely store and track your symptom history and past
                conversations to easily share with your healthcare provider.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-rose-100 transition-all group">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="h-7 w-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Nearby Facilities</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Integrated location services to instantly find the nearest
                hospitals, clinics, and emergency services when you need them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Medical Disclaimer & Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-2 opacity-50 mb-6">
            <HeartPulse className="h-6 w-6 text-slate-800" />
            <span className="text-xl font-bold text-slate-800">HealthBot</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 max-w-3xl">
            <h4 className="text-amber-800 font-bold mb-2 uppercase text-sm tracking-wider">
              Appendix E: Medical Disclaimer
            </h4>
            <p className="text-amber-700/80 text-sm leading-relaxed">
              This system provides preliminary health information only and is
              not a substitute for professional medical advice, diagnosis, or
              treatment. Always seek the advice of qualified health providers
              with any questions regarding medical conditions. Never disregard
              professional medical advice or delay seeking it because of
              information provided by this system.
            </p>
          </div>

          <p className="text-slate-400 text-sm">
            ©️ 2024-2026 HealthBot Project. Developed by Aarif, Junaid, and
            Murtaza.
          </p>
        </div>
      </footer>
    </div>
  );
}
