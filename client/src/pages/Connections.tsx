import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson, api } from "../lib/queryClient";

export default function Connections() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["connections"],
    queryFn: () =>
      apiJson<{
        procore: { connected: boolean; email?: string };
        hubspot: { connected: boolean };
        procoreReadOnly?: boolean;
      }>("GET", "/connections"),
  });
  const disconnectProcore = useMutation({
    mutationFn: () => api("POST", "/procore/disconnect"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connections"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Connections</h1>
      <p className="text-gray-600">Manage your Procore, HubSpot, and email connections.</p>

      {data?.procoreReadOnly !== false && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800">Procore: Read-only mode</p>
          <p className="text-sm text-amber-700 mt-1">
            SyncHub will not write, update, or delete any data in your Procore account. Only GET (read) requests are used.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="p-4 bg-white rounded-lg border">
          <h2 className="font-medium">Procore</h2>
          <p className="text-sm text-gray-600 mt-1">
            {data?.procore?.connected ? `Connected as: ${data.procore.email ?? "—"}` : "Not connected"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Connect via OAuth. Configure Client ID, Client Secret, and Public URL in Admin Credentials first.
          </p>
          <div className="mt-3 flex gap-2">
            {data?.procore?.connected ? (
              <button
                onClick={() => disconnectProcore.mutate()}
                disabled={disconnectProcore.isPending}
                className="text-sm text-red-600 hover:underline"
              >
                Disconnect
              </button>
            ) : (
              <a href="/api/procore/connect" className="text-sm text-blue-600 hover:underline">
                Connect Procore
              </a>
            )}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h2 className="font-medium">HubSpot</h2>
          <p className="text-sm text-gray-600 mt-1">
            {data?.hubspot?.connected ? "Connected (org-level)" : "Not connected"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Set Access Token in Admin Credentials.
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h2 className="font-medium">Email (Gmail / Outlook)</h2>
          <p className="text-sm text-gray-600 mt-1">Manage in Settings → Email Accounts</p>
          <a href="/settings/email" className="text-sm text-blue-600 hover:underline">
            Go to Email Settings
          </a>
        </div>
      </div>
    </div>
  );
}
