import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson, api } from "../lib/queryClient";

const HUBSPOT_STAGES_FALLBACK = [
  "Pipe Line", "RFP", "Estimating", "Proposal Sent", "Follow Up",
  "Approval 30 Days", "Closed Won", "Closed Lost", "On Hold",
  "Deal Canceled", "Delayed", "Approval 60-90 days",
  "Service - Estimating", "Service - Production", "Service - Won", "Service - Lost",
  "Internal Review",
];

export default function AdminStageMapping() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "stage-mappings"],
    queryFn: () => apiJson<{ mappings: { id: string; procoreStage: string; crmStage: string; crmProvider: string }[] }>("GET", "/admin/stage-mappings"),
  });
  const { data: hubspotStages } = useQuery({
    queryKey: ["admin", "hubspot-stages"],
    queryFn: () => apiJson<{ stages: { id: string; name: string }[] }>("GET", "/admin/hubspot-stages"),
  });
  const crmStages = hubspotStages?.stages?.length ? hubspotStages.stages : HUBSPOT_STAGES_FALLBACK.map((n) => ({ id: n, name: n }));
  const [procoreStage, setProcoreStage] = useState("");
  const [crmStage, setCrmStage] = useState("");
  const addMutation = useMutation({
    mutationFn: (body: { procoreStage: string; crmStage: string }) =>
      api("POST", "/admin/stage-mappings", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "stage-mappings"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api("DELETE", `/admin/stage-mappings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "stage-mappings"] }),
  });

  const handleAdd = () => {
    if (!procoreStage.trim() || !crmStage.trim()) return;
    addMutation.mutate({ procoreStage: procoreStage.trim(), crmStage: crmStage.trim() });
    setProcoreStage("");
    setCrmStage("");
  };

  const HUBSPOT_STAGES = [
    "Pipe Line", "RFP", "Estimating", "Proposal Sent", "Follow Up",
    "Approval 30 Days", "Closed Won", "Closed Lost", "On Hold",
    "Deal Canceled", "Delayed", "Approval 60-90 days",
    "Service - Estimating", "Service - Production", "Service - Won", "Service - Lost",
    "Internal Review",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stage Mapping</h1>
      <p className="text-gray-600">
        Map Procore stage names to CRM (HubSpot) stage names. Global mapping for the org.
      </p>
      <div className="p-4 bg-white rounded-lg border">
        <h2 className="font-medium mb-3">Sync Direction</h2>
        <p className="text-sm text-gray-500">Configurable per workstream in workstream config. (Procore primary / CRM primary / Bidirectional)</p>
      </div>
      <div>
        <h2 className="font-medium mb-3">Mappings</h2>
        <table className="w-full border-collapse bg-white rounded-lg border">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Procore Stage</th>
              <th className="text-left p-3">HubSpot Stage</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.mappings ?? []).map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-3">{m.procoreStage}</td>
                <td className="p-3">{m.crmStage}</td>
                <td className="p-3">
                  <button
                    onClick={() => deleteMutation.mutate(m.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Procore Stage</label>
            <input
              value={procoreStage}
              onChange={(e) => setProcoreStage(e.target.value)}
              placeholder="e.g. Submitted"
              className="px-3 py-2 border rounded w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">HubSpot Stage</label>
            <select
              value={crmStage}
              onChange={(e) => setCrmStage(e.target.value)}
              className="px-3 py-2 border rounded w-48"
            >
              <option value="">Select...</option>
              {crmStages.map((s) => (
                <option key={s.id} value={typeof s === "object" ? s.name : s}>
                  {typeof s === "object" ? s.name : s}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!procoreStage.trim() || !crmStage || addMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
