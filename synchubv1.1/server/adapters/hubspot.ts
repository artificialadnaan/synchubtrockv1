import { Client } from "@hubspot/api-client";
import { resolveCredential } from "../credentials";
import type { CRMSyncAdapter, CRMStage, CRMDeal } from "@shared/crm-adapter";

async function getHubSpotClient(): Promise<Client> {
  const token = await resolveCredential("hubspot_access_token");
  if (!token) throw new Error("HubSpot not connected. Set Access Token in Admin Credentials.");
  return new Client({ accessToken: token });
}

/** HubSpot CRM adapter. Implements CRMSyncAdapter for deals sync. */
export const hubspotAdapter: CRMSyncAdapter = {
  async getStages(pipelineId?: string): Promise<CRMStage[]> {
    const token = await resolveCredential("hubspot_access_token");
    if (!token) throw new Error("HubSpot not connected");
    const res = await fetch("https://api.hubapi.com/crm/v3/pipelines/deals", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HubSpot pipelines API: ${res.status}`);
    const data = (await res.json()) as { results?: Array<{ id: string; stages?: Array<{ id: string; label: string; metadata?: { probability?: string } }> }> };
    const pipelines = data?.results ?? [];
    const stages: CRMStage[] = [];
    for (const p of pipelines) {
      if (pipelineId && p.id !== pipelineId) continue;
      for (const s of p.stages ?? []) {
        stages.push({
          id: String(s.id),
          name: s.label ?? "",
          probability: s.metadata?.probability ? parseFloat(s.metadata.probability) * 100 : undefined,
        });
      }
      if (pipelineId) break;
    }
    return stages;
  },

  async getDealByProjectNumber(projectNumber: string): Promise<CRMDeal | null> {
    const client = await getHubSpotClient();
    const searchRes = await client.crm.deals.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "project_number",
              operator: "EQ",
              value: projectNumber,
            },
          ],
        },
      ],
      properties: ["dealname", "dealstage", "amount", "project_number"],
    });
    const deal = searchRes.results?.[0];
    if (!deal) return null;
    return {
      id: deal.id,
      name: deal.properties?.dealname,
      projectNumber: deal.properties?.project_number,
      stage: deal.properties?.dealstage,
      ...deal,
    };
  },

  async updateDealStage(dealId: string, stageId: string): Promise<void> {
    const client = await getHubSpotClient();
    await client.crm.deals.basicApi.update(dealId, {
      properties: { dealstage: stageId },
    });
  },

  async createDeal(payload: Partial<CRMDeal>): Promise<CRMDeal> {
    const client = await getHubSpotClient();
    const properties: Record<string, string> = {};
    if (payload.name) properties.dealname = payload.name;
    if (payload.projectNumber) properties.project_number = payload.projectNumber;
    if (payload.stage) properties.dealstage = payload.stage;
    const created = await client.crm.deals.basicApi.create({ properties, associations: [] });
    return {
      id: created.id,
      name: created.properties?.dealname,
      projectNumber: created.properties?.project_number,
      stage: created.properties?.dealstage,
      ...created,
    };
  },
};
