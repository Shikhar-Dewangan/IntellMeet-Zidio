export default function StatCard({ icon, label, value, change, tone = "" }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small className={change?.startsWith("+") ? "positive" : ""}>{change}</small></div></div>;
}