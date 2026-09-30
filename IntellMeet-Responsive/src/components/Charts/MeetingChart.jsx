import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [{day:"Mon", meetings:5},{day:"Tue",meetings:8},{day:"Wed",meetings:6},{day:"Thu",meetings:10},{day:"Fri",meetings:7}];

export default function MeetingChart() {
  return <div className="chart-card"><div className="card-heading"><div><h3>Meeting activity</h3><p>Meetings held this week</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={250}><BarChart data={data}><XAxis dataKey="day"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="meetings" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div>;
}