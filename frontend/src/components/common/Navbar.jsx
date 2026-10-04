import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Video } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "How it works", href: "#how-it-works" },
  { name: "AI Intelligence", href: "#ai-intelligence" },
  { name: "Collaboration", href: "#collaboration" },
  { name: "FAQ", href: "#faq" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 xl:h-20">

          {/* ===== LEFT: Logo ===== */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              IntelliMeet
            </span>
          </Link>

          {/* ===== CENTER: Nav links (properly spaced) ===== */}
          <nav className="hidden xl:flex items-center gap-5 2xl:gap-7 mx-auto">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* ===== RIGHT: Toggle + Auth ===== */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 whitespace-nowrap"
            >
              Get started
            </Link>
          </div>

          {/* ===== Mobile: toggle + hamburger ===== */}
          <div className="xl:hidden flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* ===== Mobile menu ===== */}
        {open && (
          <div className="xl:hidden pb-4 pt-2 space-y-1 border-t border-slate-200">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="block text-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}