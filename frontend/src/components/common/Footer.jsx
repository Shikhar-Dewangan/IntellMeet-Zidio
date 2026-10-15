export default function Footer() {
  const link = "text-xs text-fg-3 hover:text-fg transition";
  return (
    <footer className="border-t border-line bg-page">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-fg-3">© 2026 IntelliMeet. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className={link}>Privacy</a>
          <a href="#" className={link}>Terms</a>
          <a href="#" className={link}>Support</a>
        </div>
      </div>
    </footer>
  );
}
