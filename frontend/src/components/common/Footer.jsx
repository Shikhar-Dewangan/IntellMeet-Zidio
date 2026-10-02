export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          © 2026 IntelliMeet. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="text-xs text-slate-500 hover:text-slate-900 transition"
          >
            Privacy
          </a>
          <a
            href="#"
            className="text-xs text-slate-500 hover:text-slate-900 transition"
          >
            Terms
          </a>
          <a
            href="#"
            className="text-xs text-slate-500 hover:text-slate-900 transition"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
