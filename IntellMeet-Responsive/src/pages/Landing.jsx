import { ArrowRight, Bot, CheckCircle2, MessageSquare, Play, Sparkles, Video, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";

const features = [
  ["AI meeting intelligence", "Turn conversations into summaries, decisions and assigned action items.", Bot],
  ["Real-time meetings", "Low-latency video collaboration with chat, presence and meeting controls.", Video],
  ["Team collaboration", "Keep projects, tasks and follow-ups connected to every meeting.", MessageSquare],
  ["Smart productivity", "Use analytics and insights to understand meeting activity and engagement.", Zap]
];

export default function Landing() {
  return <div className="landing">
    <Navbar/>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={15}/> AI-powered collaboration</span>
        <h1>Meetings that turn into <span>momentum.</span></h1>
        <p>IntellMeet brings real-time video meetings, AI summaries, smart action items and team collaboration into one enterprise workspace.</p>
        <div className="hero-actions"><Link to="/signup" className="btn btn-primary btn-lg">Start for free <ArrowRight size={18}/></Link><a href="#features" className="btn btn-secondary btn-lg"><Play size={17}/> Explore features</a></div>
        <div className="trust-row"><CheckCircle2 size={17}/> Secure workspace <CheckCircle2 size={17}/> AI-ready <CheckCircle2 size={17}/> Team collaboration</div>
      </div>
      <div className="hero-visual">
        <div className="dashboard-preview">
          <div className="preview-top"><span className="live-dot"/> Live meeting <span>10:32 AM</span></div>
          <div className="video-grid"><div className="video-tile main-tile"><div className="tile-avatar">AK</div><span>Alex Kumar</span></div><div className="video-tile"><div className="tile-avatar alt">PS</div><span>Priya Shah</span></div><div className="video-tile"><div className="tile-avatar third">RM</div><span>Rahul Mehta</span></div><div className="video-tile ai-tile"><Bot size={30}/><strong>AI Notes</strong><small>Summary is being generated...</small></div></div>
          <div className="preview-controls"><span>●</span><span>🎙</span><span>📹</span><span>▣</span><b>End</b></div>
        </div>
      </div>
    </section>
    <section id="features" className="section"><div className="section-heading"><span className="eyebrow">ONE WORKSPACE</span><h2>Everything your meetings need</h2><p>Designed around the production goals in the IntellMeet project specification.</p></div><div className="feature-grid">{features.map(([title, text, Icon]) => <div className="feature-card" key={title}><div className="feature-icon"><Icon size={22}/></div><h3>{title}</h3><p>{text}</p></div>)}</div></section>
    <section id="workflow" className="section soft"><div className="workflow"><div><span className="eyebrow">FROM TALK TO ACTION</span><h2>Capture the meeting. Keep the outcome.</h2><p>Meeting intelligence is designed to reduce manual follow-up by turning discussion into searchable summaries and trackable work.</p></div><div className="steps"><div><b>01</b><span>Meet</span><p>Connect with your team using real-time video and chat.</p></div><div><b>02</b><span>Understand</span><p>Generate transcription, summary and action items.</p></div><div><b>03</b><span>Execute</span><p>Assign tasks and monitor progress after the call.</p></div></div></div></section>
    <section id="security" className="section security-section"><div><span className="eyebrow">ENTERPRISE READY</span><h2>Built for secure collaboration</h2><p>JWT authentication, role-based access, rate limiting and observability are part of the planned production architecture.</p></div><Link to="/signup" className="btn btn-primary">Create your workspace <ArrowRight size={17}/></Link></section>
    <footer className="footer"><span>© 2026 IntellMeet</span><span>AI-powered enterprise meeting & collaboration</span></footer>
  </div>;
}