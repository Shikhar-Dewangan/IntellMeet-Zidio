import { Eye } from "lucide-react";
import Toggle from "../../components/ui/Toggle.jsx";

export default function PrivacySection() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-5 w-5 text-accent-600 dark:text-accent-400" />
          <h2 className="text-lg font-semibold text-fg">Privacy</h2>
        </div>
        <p className="text-sm text-fg-3">Control what others can see</p>
      </div>

      <div className="rounded-xl border border-line bg-card p-4 divide-y divide-line">
        <Toggle label="Show online status" description="Let others see when you're online" defaultChecked />
        <Toggle label="Show read receipts" description="Let others know when you've read their messages" defaultChecked />
        <Toggle label="Profile visibility in search" description="Allow others to find you by email" defaultChecked />
        <Toggle label="Show in participant lists" description="Appear in meeting participant lists" defaultChecked />
      </div>
    </div>
  );
}