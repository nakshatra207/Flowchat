import { Card } from "../components/ui/card";
import { useAuthStore } from "../store/auth-store";

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h1 className="text-xl font-semibold">Settings</h1>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium">{user?.role}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Presence</dt>
            <dd className="font-medium">{user?.presence}</dd>
          </div>
        </dl>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Browser Notifications</h2>
        <button
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold"
          onClick={() => Notification.requestPermission()}
        >
          Enable notifications
        </button>
      </Card>
    </div>
  );
}

