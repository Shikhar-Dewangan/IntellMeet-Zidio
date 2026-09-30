import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email,setEmail] = useState(""); const [password,setPassword] = useState(""); const [error,setError] = useState("");
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const submit = async e => { e.preventDefault(); try { await login(email,password); navigate(location.state?.from?.pathname || "/dashboard"); } catch(err){ setError(err.message); } };
  return <div className="auth-page"><div className="auth-brand"><Link to="/" className="brand"><span className="brand-mark">I</span>IntellMeet</Link></div><div className="auth-card"><div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h1>Sign in to IntellMeet</h1><p>Continue to your meetings and team workspace.</p></div>{error && <div className="form-error">{error}</div>}<form onSubmit={submit}><label>Email<div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/></div></label><label>Password<div className="input-wrap"><LockKeyhole size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div></label><button className="btn btn-primary btn-full">Sign in</button></form><p className="auth-switch">Don't have an account? <Link to="/signup">Create one</Link></p></div></div>;
}