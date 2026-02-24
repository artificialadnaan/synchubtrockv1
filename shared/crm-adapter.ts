/**
 * CRM Sync Adapter interface.
 * Implement for HubSpot first; add Salesforce, Pipedrive, custom later.
 */
export interface CRMStage {
  id: string;
  name: string;
  probability?: number;
}

export interface CRMDeal {
  id: string;
  name?: string;
  projectNumber?: string;
  stage?: string;
  [key: string]: unknown;
}

export interface CRMSyncAdapter {
  getStages(pipelineId?: string): Promise<CRMStage[]>;
  getDealByProjectNumber(projectNumber: string): Promise<CRMDeal | null>;
  updateDealStage(dealId: string, stageId: string): Promise<void>;
  createDeal(payload: Partial<CRMDeal>): Promise<CRMDeal>;
}
