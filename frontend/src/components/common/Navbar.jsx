import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Video } from "lucide-react";

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
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              IntelliMeet
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
            >
              Get started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden pb-4 pt-2 space-y-1 border-t border-slate-200">
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
