import { useQuery } from "@tanstack/react-query";
import { apiJson } from "../lib/queryClient";

export default function Logs() {
  const { data } = useQuery({
    queryKey: ["logs"],
    queryFn: () =>
      apiJson<{ logs: { id: string; workstreamId: string | null; status: string; message: string | null; createdAt: string }[] }>(
        "GET",
        "/logs"
      ),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Logs</h1>
      <p className="text-gray-600">Activity and sync logs.</p>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 text-sm font-medium">Time</th>
              <th className="text-left p-3 text-sm font-medium">Workstream</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
              <th className="text-left p-3 text-sm font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {(data?.logs ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  No logs yet.
                </td>
              </tr>
            ) : (
              (data?.logs ?? []).map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-3 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-sm">{log.workstreamId ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        log.status === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{log.message ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
