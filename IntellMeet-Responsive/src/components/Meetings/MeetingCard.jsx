import { Calendar, Clock, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";

export default function MeetingCard({ meeting }) {
  return <article className="meeting-card">
    <div className="meeting-card-top"><span className="pill">{meeting.type}</span><span className="muted">{meeting.status}</span></div>
    <h3>{meeting.title}</h3><p>{meeting.description}</p>
    <div className="meeting-meta"><span><Calendar size={15}/>{meeting.date}</span><span><Clock size={15}/>{meeting.time}</span><span><Users size={15}/>{meeting.participants}</span></div>
    <Link className="btn btn-primary btn-sm" to={`/meetings/${meeting.id}`}><Video size={16}/> Join meeting</Link>
  </article>;
}