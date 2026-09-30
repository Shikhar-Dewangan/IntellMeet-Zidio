import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SignUp() {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState("");
  const { signup }=useAuth(); const navigate=useNavigate();
  const submit=async e=>{e.preventDefault();try{await signup(name,email,password);navigate("/dashboard");}catch(err){setError(err.message);}};
  return <div className="auth-page"><div className="auth-brand"><Link to="/" className="brand"><span className="brand-mark">I</span>IntellMeet</Link></div><div className="auth-card"><div className="auth-heading"><span className="eyebrow">GET STARTED</span><h1>Create your workspace</h1><p>Start collaborating with smarter meetings.</p></div>{error&&<div className="form-error">{error}</div>}<form onSubmit={submit}><label>Full name<div className="input-wrap"><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Kumar" required/></div></label><label>Work email<div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/></div></label><label>Password<div className="input-wrap"><LockKeyhole size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" minLength="8" required/></div></label><button className="btn btn-primary btn-full">Create account</button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></div></div>;
}