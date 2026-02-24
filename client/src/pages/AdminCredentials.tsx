import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiJson, api } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";

const SECTIONS = [
  { key: "procore_client_id", label: "Procore Client ID" },
  { key: "procore_client_secret", label: "Procore Client Secret" },
  { key: "hubspot_access_token", label: "HubSpot Access Token" },
  { key: "google_client_id", label: "Google Client ID" },
  { key: "google_client_secret", label: "Google Client Secret" },
  { key: "microsoft_client_id", label: "Microsoft Client ID" },
  { key: "microsoft_client_secret", label: "Microsoft Client Secret" },
  { key: "public_url", label: "Public URL (OAuth redirect base)" },
] as const;

export default function AdminCredentials() {
  const { data } = useQuery({
    queryKey: ["admin", "credentials"],
    queryFn: () => apiJson<{ credentials: Record<string, boolean> }>("GET", "/admin/credentials"),
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = async (key: string) => {
    const value = values[key];
    if (!value?.trim()) return;
    setSaving(key);
    try {
      await api("POST", "/admin/credentials", { key, value: value.trim() });
      queryClient.invalidateQueries({ queryKey: ["admin", "credentials"] });
      setValues((v) => ({ ...v, [key]: "" }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Credentials</h1>
      <p className="text-gray-600">
        Enter OAuth and API keys. Values are encrypted at rest. DB takes precedence over env vars.
      </p>
      <div className="space-y-4">
        {SECTIONS.map(({ key, label }) => (
          <div key={key} className="p-4 bg-white rounded-lg border">
            <label className="block text-sm font-medium mb-2">{label}</label>
            <div className="flex gap-2">
              <input
                type={key.includes("secret") || key.includes("token") ? "password" : "text"}
                value={values[key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                placeholder={data?.credentials?.[key] ? "•••••••• (set)" : "Enter value"}
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSave(key)}
                disabled={!values[key]?.trim() || saving === key}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === key ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
