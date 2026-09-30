import { CalendarDays, CheckSquare, Clock3, Video } from "lucide-react";
import StatCard from "../components/common/StatCard";
import MeetingChart from "../components/Charts/MeetingChart";
import MeetingCard from "../components/Meetings/MeetingCard";
import { useAuth } from "../context/AuthContext";

const meetings=[{id:"m1",title:"Product strategy sync",description:"Q4 roadmap, priorities and ownership.",type:"Team",status:"Upcoming",date:"Today",time:"10:30 AM",participants:8},{id:"m2",title:"Client discovery",description:"Review requirements and next steps.",type:"Client",status:"Upcoming",date:"Today",time:"2:00 PM",participants:5},{id:"m3",title:"Engineering stand-up",description:"Progress, blockers and action items.",type:"Daily",status:"Completed",date:"Yesterday",time:"9:30 AM",participants:12}];

export default function Dashboard(){
 const {user}=useAuth();
 return <div><div className="page-heading"><div><span className="eyebrow">OVERVIEW</span><h1>Good morning, {user?.name || "there"}.</h1><p>Here’s what’s happening across your workspace.</p></div><a className="btn btn-primary" href="/meetings/m-new"><Video size={17}/> Start meeting</a></div>
 <div className="stats-grid"><StatCard icon={<Video/>} label="Meetings this week" value="36" change="+12% vs last week" tone="blue"/><StatCard icon={<Clock3/>} label="Hours in meetings" value="24.5h" change="+4.8% vs last week" tone="purple"/><StatCard icon={<CheckSquare/>} label="Open action items" value="18" change="6 due today" tone="green"/><StatCard icon={<CalendarDays/>} label="Upcoming" value="7" change="Next 7 days" tone="orange"/></div>
 <div className="dashboard-grid"><MeetingChart/><div className="activity-card"><div className="card-heading"><div><h3>AI meeting insights</h3><p>Latest generated intelligence</p></div><span className="ai-badge">AI</span></div><div className="insight"><b>Product strategy sync</b><p>3 decisions captured · 5 action items</p><span>Summary ready</span></div><div className="insight"><b>Client discovery</b><p>2 open questions · 3 action items</p><span>Processing</span></div><button className="btn btn-secondary btn-full">View meeting history</button></div></div>
 <section><div className="section-inline"><h2>Upcoming meetings</h2><a href="/meetings">View all</a></div><div className="meeting-list">{meetings.map(m=><MeetingCard key={m.id} meeting={m}/>)}</div></section>
 </div>;
}