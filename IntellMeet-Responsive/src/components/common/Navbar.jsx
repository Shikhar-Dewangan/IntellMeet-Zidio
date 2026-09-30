import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="public-nav">
      <Link className="brand" to="/">
        <span className="brand-mark">I</span>
        <span>IntellMeet</span>
      </Link>
      <nav>
        <a href="#features">Features</a>
        <a href="#workflow">How it works</a>
        <a href="#security">Security</a>
        <Link to="/login" className="nav-login">Sign in</Link>
        <Link to="/signup" className="btn btn-primary">Get started</Link>
      </nav>
    </header>
  );
}