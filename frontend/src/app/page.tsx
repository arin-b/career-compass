"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Map, Sparkles, MessageSquare, Target, Upload, UserPlus, ClipboardList, Rocket, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ───────────────────── Intersection Observer hook ───────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ───────────────────── Feature card data ───────────────────── */
const features = [
  {
    icon: Map,
    title: "AI-Powered Roadmaps",
    desc: "Upload your academic transcripts and let our AI craft a personalised career roadmap with milestones, skills, and projects tailored to your goals.",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: MessageSquare,
    title: "Smart AI Chat Assistant",
    desc: "Have a real-time conversation with our AI to refine your career path, explore alternatives, and get expert-level guidance on demand.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Target,
    title: "Track Your Progress",
    desc: "Check off milestones as you complete them, visualise your progress with beautiful dashboards, and celebrate with confetti when you finish!",
    gradient: "from-blue-500 to-cyan-500",
  },
];

/* ───────────────────── Steps data ───────────────────── */
const steps = [
  { icon: UserPlus, title: "Sign Up", desc: "Create your free account in seconds." },
  { icon: ClipboardList, title: "Build Your Profile", desc: "Add your major, transcripts, hobbies & career goals." },
  { icon: Rocket, title: "Get Your Roadmap", desc: "AI generates a step-by-step career plan just for you." },
];

/* ═══════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroReveal = useReveal();
  const featuresReveal = useReveal();
  const stepsReveal = useReveal();
  const ctaReveal = useReveal();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* ── Background ambient glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(236,72,153,0.12),transparent_60%)]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(59,130,246,0.1),transparent_60%)]" />
      </div>

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] transition-transform group-hover:scale-110">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Map className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              CareerCompass
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5 px-5 h-10 rounded-full text-sm font-medium transition-colors">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 h-10 rounded-full text-sm font-semibold shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-[1.03]">
                Sign Up Free
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-black/90 backdrop-blur-xl px-6 py-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5 rounded-xl h-11">
                Login
              </Button>
            </Link>
            <Link href="/signup" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl h-11 font-semibold shadow-lg shadow-purple-500/25">
                Sign Up Free
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <section
        ref={heroReveal.ref}
        className={`relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-24 md:pt-40 md:pb-36 text-center transition-all duration-1000 ease-out ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-8">
          <Sparkles className="w-4 h-4" />
          Powered by AI
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            Navigate Your Career
          </span>
          <br />
          <span className="text-white">with Artificial Intelligence</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg md:text-xl text-gray-400 leading-relaxed">
          Upload your transcript, tell us your dreams, and let our AI build a
          step-by-step career roadmap — complete with milestones, skill
          targets, and project ideas.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 h-13 rounded-full text-base font-semibold shadow-xl shadow-purple-600/30 transition-all hover:shadow-purple-500/50 hover:scale-[1.03] flex items-center gap-2">
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:bg-white/5 hover:border-gray-500 px-8 h-13 rounded-full text-base font-medium transition-all">
              Learn More
            </Button>
          </a>
        </div>

        {/* Decorative floating orbs */}
        <div className="pointer-events-none absolute -top-16 left-1/4 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-10 right-1/4 w-44 h-44 bg-pink-600/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section
        id="features"
        ref={featuresReveal.ref}
        className={`relative z-10 mx-auto max-w-6xl px-6 py-24 transition-all duration-1000 ease-out delay-100 ${featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Everything You Need to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Succeed
            </span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            CareerCompass combines cutting-edge AI with thoughtful design to help you chart the perfect career path.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl p-8 transition-all duration-300 hover:border-gray-700 hover:bg-gray-900/70 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/5"
            >
              {/* Icon circle */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} p-[2px] mb-6 transition-transform group-hover:scale-110`}>
                <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed text-[0.95rem]">{f.desc}</p>

              {/* Glow on hover */}
              <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${f.gradient} blur-xl -z-10 scale-95`} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section
        ref={stepsReveal.ref}
        className={`relative z-10 mx-auto max-w-5xl px-6 py-24 transition-all duration-1000 ease-out delay-200 ${stepsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            How It{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Works</span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg">Three simple steps to your personalised career roadmap.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center group">
              {/* Step number */}
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-purple-500/40">
                <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2 text-white">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-[260px] mx-auto">{s.desc}</p>

              {/* Connector line (hidden on last & mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+48px)] w-[calc(100%-96px)] h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      <section
        ref={ctaReveal.ref}
        className={`relative z-10 mx-auto max-w-4xl px-6 py-24 text-center transition-all duration-1000 ease-out delay-200 ${ctaReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-purple-900/30 via-gray-900/60 to-pink-900/30 backdrop-blur-xl p-12 md:p-16 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-60 h-60 bg-pink-600/15 rounded-full blur-3xl" />

          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">
            Ready to Chart Your Future?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto relative z-10">
            Join thousands of students who are navigating their careers with the power of AI.
          </p>
          <Link href="/signup" className="relative z-10">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 h-13 rounded-full text-base font-semibold shadow-xl shadow-purple-600/30 transition-all hover:shadow-purple-500/50 hover:scale-[1.03]">
              Get Started — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-gray-400">CareerCompass</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-gray-300 transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-gray-300 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
