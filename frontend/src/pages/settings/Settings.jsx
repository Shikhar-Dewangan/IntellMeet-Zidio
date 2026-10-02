import { useSelector } from "react-redux";
import { UserCircle2 } from "lucide-react";
import { PageHeader, SectionCard } from "../../components/ui/Shared.jsx";

export default function Settings() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Your account details." />

      <SectionCard title="Account" icon={UserCircle2}>
        <div className="space-y-3 p-5 text-sm">
          <Row label="Full name" value={user?.fullName || "-"} />
          <Row label="Email" value={user?.email || "-"} />
          <Row label="Role" value={user?.role || "-"} />
        </div>
      </SectionCard>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
