import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiJson } from "../lib/queryClient";

export default function Dashboard() {
  const { data: workstreams } = useQuery({
    queryKey: ["dashboard", "workstreams"],
    queryFn: () => apiJson<{ workstreams: { id: string; name: string; status: string }[] }>("GET", "/dashboard/workstreams"),
  });
  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: () => apiJson<{ procore: { connected: boolean }; hubspot: { connected: boolean } }>("GET", "/connections"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-white rounded-lg border">
          <h2 className="font-medium mb-2">Connected Services</h2>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>Procore: {connections?.procore?.connected ? "✓ Connected" : "—"}</li>
            <li>HubSpot: {connections?.hubspot?.connected ? "✓ Connected" : "—"}</li>
          </ul>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <h2 className="font-medium mb-2">Recent Activity</h2>
          <p className="text-sm text-gray-500">No recent activity yet.</p>
        </div>
      </div>
      <div>
        <h2 className="font-medium mb-3">Workstreams</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(workstreams?.workstreams ?? []).map((w) => (
            <div key={w.id} className="block p-4 bg-white rounded-lg border">
              <div className="font-medium">{w.name}</div>
              <div className="text-sm text-gray-500">Status: {w.status}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          <Link href="/connections" className="text-blue-600 hover:underline">Connect services</Link> and configure credentials in Admin.
        </p>
      </div>
    </div>
  );
}
