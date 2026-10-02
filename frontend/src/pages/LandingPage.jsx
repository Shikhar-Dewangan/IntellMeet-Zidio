import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import {
  Video,
  FileText,
  CheckSquare,
  Users,
  Sparkles,
  MessageSquare,
  Monitor,
  Mic,
  MicOff,
  VideoIcon,
  PhoneOff,
  MoreHorizontal,
  Plus,
  PlayCircle,
  ClipboardList,
  BarChart3,
  Search,
} from "lucide-react";

/* ============ FEATURES (image ke according) ============ */

const features = [
  {
    icon: Video,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "HD Video Meetings",
    desc: "Crystal clear, low-latency video meetings with screen sharing and recording.",
  },
  {
    icon: FileText,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    title: "AI Transcriptions",
    desc: "Get accurate transcripts, summaries and key insights automatically.",
  },
  {
    icon: CheckSquare,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Tasks & Action Items",
    desc: "Turn discussions into actionable tasks and track progress.",
  },
  {
    icon: Users,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Team Workspaces",
    desc: "Collaborate with your team on projects, notes and shared resources.",
  },
];

/* ============ PAGE ============ */

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <Navbar />

      <main>
        {/* ============ HERO ============ */}
        <section
          id="home"
          className="relative overflow-hidden bg-linear-to-b from-slate-50 via-white to-white scroll-mt-20"
        >
          {/* Subtle decorative blobs */}
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
          <div className="absolute top-40 -right-20 w-96 h-96 rounded-full bg-violet-100/40 blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left — content */}
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Video Meetings • AI • Tasks
                </span>

                <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] text-slate-900">
                  Turn meetings into{" "}
                  <span className="text-blue-600">actionable work.</span>
                </h1>

                <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  IntelliMeet is an enterprise meeting and collaboration
                  platform that brings real-time video meetings, AI meeting
                  intelligence, shared notes, tasks, and projects together.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <a
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
                  >
                    Get started
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                  <a
                    href="/login"
                    className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-center"
                  >
                    Sign in
                  </a>
                </div>

                {/* Feature checks */}
                <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
                  {[
                    "Real-time video meetings",
                    "AI transcription & summaries",
                    "Action items with assignees",
                    "Team workspaces & projects",
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <svg
                          className="w-3 h-3 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — product mockup */}
              <div className="relative">
                <ProductMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section
          id="features"
          className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Features
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                Everything you need for productive meetings
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                From real-time collaboration to AI-powered insights, IntelliMeet
                brings all your meeting workflows together in one seamless
                platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-6 h-6 ${f.iconColor}`} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section
          id="how-it-works"
          className="py-16 sm:py-20 lg:py-24 bg-slate-50 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                How it works
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                From meeting to action in four steps
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  step: "01",
                  title: "Create or join",
                  desc: "Start a real-time video meeting with screen sharing and recording.",
                },
                {
                  step: "02",
                  title: "AI captures",
                  desc: "AI transcribes the meeting, generates a summary and extracts action items.",
                },
                {
                  step: "03",
                  title: "Collaborate live",
                  desc: "In-meeting chat, shared notes and task creation keep everyone aligned.",
                },
                {
                  step: "04",
                  title: "Track and follow up",
                  desc: "Post-meeting dashboard shows summaries, action items and recordings.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-6 rounded-2xl bg-white border border-slate-200"
                >
                  <span className="text-3xl font-extrabold text-blue-100">
                    {s.step}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ AI INTELLIGENCE ============ */}
        <section
          id="ai-intelligence"
          className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  AI Meeting Intelligence
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  AI that transcribes, summarises, and extracts action items
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  During the meeting, IntelliMeet runs AI transcription,
                  generates a concise summary, and extracts action items with
                  assigned owners — so no one has to take manual notes.
                </p>

                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Automatic meeting transcription",
                    "AI-generated summaries",
                    "Action items with assignees",
                    "Searchable meeting history",
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <span className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <svg
                          className="w-3 h-3 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI panel mockup */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xl">
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-medium">
                    AI Summary
                  </span>
                  <span className="px-3 py-1 rounded-md text-slate-500 text-xs">
                    Notes
                  </span>
                  <span className="px-3 py-1 rounded-md text-slate-500 text-xs">
                    Tasks
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 mb-2">
                      Key discussion points
                    </p>
                    {[
                      "Finalize Q3 design language",
                      "Prepare API documentation",
                      "Plan development timeline",
                    ].map((t) => (
                      <p
                        key={t}
                        className="text-xs text-slate-600 flex gap-2 leading-relaxed"
                      >
                        <span className="text-blue-500 shrink-0">•</span>
                        {t}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 mb-2">
                      Action items
                    </p>
                    {[
                      { task: "Update Figma designs", owner: "Navya" },
                      { task: "Share API documentation", owner: "Ananya" },
                      { task: "Schedule follow-up", owner: "Priya" },
                    ].map((t) => (
                      <p
                        key={t.task}
                        className="text-xs text-slate-600 flex gap-2 leading-relaxed"
                      >
                        <span className="text-emerald-500 shrink-0">☐</span>
                        {t.task}
                        <span className="text-slate-400">— {t.owner}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ COLLABORATION ============ */}
        <section
          id="collaboration"
          className="py-16 sm:py-20 lg:py-24 bg-slate-50 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Collaboration
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                Collaborate during the meeting
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                In-meeting chat, shared notes, and task creation keep everyone
                aligned without leaving the conversation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: MessageSquare,
                  title: "In-meeting chat",
                  desc: "Real-time chat synced across all participants.",
                },
                {
                  icon: FileText,
                  title: "Shared notes",
                  desc: "Collaborative notes visible to everyone in the meeting.",
                },
                {
                  icon: CheckSquare,
                  title: "Task creation",
                  desc: "Create and assign tasks during the meeting.",
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="p-6 rounded-2xl bg-white border border-slate-200"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section
          id="faq"
          className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                FAQ
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                Frequently asked questions
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "What is IntelliMeet?",
                  a: "IntelliMeet is an enterprise meeting and collaboration platform that combines real-time video meetings, AI meeting intelligence, team collaboration, tasks, and projects in one place.",
                },
                {
                  q: "What does the AI do during a meeting?",
                  a: "It runs AI transcription, generates a concise summary of the discussion, and extracts action items with assigned owners.",
                },
                {
                  q: "Can I create tasks during a meeting?",
                  a: "Yes. Tasks can be created during the meeting and assigned to the right people. Action items extracted by AI can also be turned into tasks.",
                },
                {
                  q: "Does IntelliMeet support team workspaces and projects?",
                  a: "Yes. It supports team workspaces, project boards with kanban-style task management, and task assignment.",
                },
                {
                  q: "Can I access past meetings?",
                  a: "Yes. Meeting history is searchable and includes recordings, summaries, and action items.",
                },
              ].map((f, i) => (
                <details
                  key={i}
                  className="group rounded-2xl bg-white border border-slate-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none">
                    <span className="text-sm sm:text-base font-semibold text-slate-900">
                      {f.q}
                    </span>
                    <svg
                      className="w-5 h-5 text-slate-400 group-open:rotate-180 transition shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CONTACT CTA ============ */}
        <section
          id="contact"
          className="py-16 sm:py-20 lg:py-24 bg-slate-50 scroll-mt-20"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-linear-to-br from-blue-600 to-blue-800 p-8 sm:p-12 lg:p-16 text-center shadow-2xl shadow-blue-600/20">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Ready to turn your meetings into work?
              </h2>
              <p className="mt-4 text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Bring video meetings, AI meeting intelligence, collaboration,
                tasks, and projects together with IntelliMeet.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition shadow-lg"
                >
                  Get started
                </a>
                <a
                  href="/login"
                  className="px-6 py-3.5 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition"
                >
                  Sign in
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ============================================================
   PRODUCT MOCKUP (image ke according)
   ============================================================ */

function ProductMockup() {
  const participants = [
    { name: "You", color: "bg-blue-500", initials: "R" },
    { name: "Priya Sharma", color: "bg-violet-500", initials: "P" },
    { name: "Rohit Verma", color: "bg-emerald-500", initials: "R" },
    { name: "Ananya", color: "bg-rose-500", initials: "A" },
    { name: "Arjun", color: "bg-amber-500", initials: "A" },
  ];

  return (
    <div className="rounded-2xl bg-slate-900 p-3 shadow-2xl shadow-blue-900/20 border border-slate-800">
      <div className="rounded-xl bg-slate-950 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shrink-0">
              <Video className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-white truncate">
              IntelliMeet
            </span>
            <span className="hidden sm:block text-[10px] text-slate-500 truncate">
              Product Planning Meeting
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              00:24:15
            </span>
            <span className="hidden sm:flex items-center gap-1 text-[9px] text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Recording
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-3 gap-2 p-2">
          {/* Left: video grid (2 cols) */}
          <div className="col-span-2 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {participants.slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  className="aspect-4/3 rounded-lg bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white text-[10px] font-bold`}
                  >
                    {p.initials}
                  </div>
                  <span className="absolute bottom-1 left-1.5 text-[8px] text-white/80 font-medium truncate max-w-[90%]">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {participants.slice(3).map((p, i) => (
                <div
                  key={i}
                  className="aspect-4/3 rounded-lg bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white text-[10px] font-bold`}
                  >
                    {p.initials}
                  </div>
                  <span className="absolute bottom-1 left-1.5 text-[8px] text-white/80 font-medium truncate max-w-[90%]">
                    {p.name}
                  </span>
                </div>
              ))}
              <div className="aspect-4/3 rounded-lg bg-slate-800/60 border border-dashed border-slate-700 flex items-center justify-center">
                <span className="text-[10px] text-slate-500 font-medium">
                  +3 others
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-1.5 pt-1 pb-1">
              {[Mic, VideoIcon, Monitor, MoreHorizontal].map((Icon, i) => (
                <span
                  key={i}
                  className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center"
                >
                  <Icon className="w-3 h-3 text-slate-400" />
                </span>
              ))}
              <span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                <PhoneOff className="w-3 h-3 text-white" />
              </span>
            </div>
          </div>

          {/* Right: AI panel */}
          <div className="bg-slate-900 rounded-lg p-2 space-y-2 col-span-1">
            <div className="flex gap-1 text-[8px]">
              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium">
                AI Summary
              </span>
              <span className="px-1.5 py-0.5 text-slate-500">Transcript</span>
              <span className="px-1.5 py-0.5 text-slate-500">Chat</span>
            </div>

            <div>
              <p className="text-[9px] font-semibold text-slate-200 mb-1">
                Meeting Summary
              </p>
              <p className="text-[8px] text-slate-500 leading-relaxed">
                Discussed product roadmap, finalized Q3 features, assigned
                action items and planned development timeline.
              </p>
            </div>

            <div>
              <p className="text-[9px] font-semibold text-slate-200 mb-1">
                Key Points
              </p>
              {[
                "Q3 feature list finalized",
                "API architecture discussed",
                "UI/UX design improvements",
                "Performance optimization",
              ].map((t) => (
                <p
                  key={t}
                  className="text-[8px] text-slate-500 leading-relaxed flex gap-1"
                >
                  <span className="text-blue-500 shrink-0">•</span>
                  <span className="truncate">{t}</span>
                </p>
              ))}
            </div>

            <div>
              <p className="text-[9px] font-semibold text-slate-200 mb-1">
                Action Items
              </p>
              {[
                { t: "Update Figma designs", who: "Navya" },
                { t: "Prepare API documentation", who: "Rohit" },
                { t: "Plan marketing strategy", who: "Ananya" },
              ].map((a) => (
                <p
                  key={a.t}
                  className="text-[8px] text-slate-500 leading-relaxed flex gap-1"
                >
                  <span className="text-emerald-500 shrink-0">☐</span>
                  <span className="truncate flex-1">{a.t}</span>
                  <span className="text-slate-600 shrink-0">{a.who}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
