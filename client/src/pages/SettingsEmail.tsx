import { useQuery } from "@tanstack/react-query";
import { apiJson } from "../lib/queryClient";

export default function SettingsEmail() {
  const { data } = useQuery({
    queryKey: ["settings", "email"],
    queryFn: () => apiJson<{ connections: { id: string; email: string; provider: string; isDefault: boolean }[] }>("GET", "/settings/email-connections"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Email Accounts</h1>
      <p className="text-gray-600">
        Choose which email account sends updates, stage changes, and alerts.
      </p>
      <div className="space-y-3">
        <h2 className="font-medium">Connected Accounts</h2>
        {(data?.connections ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No email accounts connected yet.</p>
        ) : (
          <ul className="space-y-2">
            {(data?.connections ?? []).map((c) => (
              <li key={c.id} className="flex items-center gap-2 p-3 bg-white rounded border">
                <span>{c.email}</span>
                <span className="text-xs text-gray-500">({c.provider})</span>
                {c.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Default</span>}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <a href="/api/auth/gmail/connect" className="text-sm text-blue-600 hover:underline">
            + Add Gmail
          </a>
          <a href="/api/auth/outlook/connect" className="text-sm text-blue-600 hover:underline">
            + Add Outlook
          </a>
        </div>
        <p className="text-xs text-gray-500">
          Gmail and Outlook OAuth flows will be implemented in a later phase.
        </p>
      </div>
    </div>
  );
}
