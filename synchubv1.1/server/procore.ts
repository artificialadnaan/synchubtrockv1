/**
 * PROCORE API - READ-ONLY MODE
 *
 * This module is configured to perform NO write operations to Procore.
 * Only GET requests are allowed. No POST, PUT, PATCH, or DELETE.
 *
 * Your Procore account is live - we will NOT modify any data.
 */

import { randomBytes, createHmac } from "crypto";
import { resolveCredential } from "./credentials";

const PROCORE_OAUTH_BASE = "https://login.procore.com/oauth";
const PROCORE_API_BASE = "https://api.procore.com";

/** Enforced read-only: only GET requests are used. No writes to Procore. */
export const PROCORE_READ_ONLY = true;

function getSigningSecret(): string {
  return process.env.SESSION_SECRET || "fallback-signing-key";
}

function signState(payload: string): string {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

export async function getProcoreAuthUrl(redirectUri: string): Promise<{ url: string; state: string }> {
  const clientId = await resolveCredential("procore_client_id") ?? process.env.PROCORE_CLIENT_ID;
  if (!clientId) throw new Error("Procore Client ID not configured. Set in Admin Credentials or env.");

  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${nonce}:${timestamp}:${redirectUri}`;
  const signature = signState(payload);
  const state = Buffer.from(JSON.stringify({ nonce, timestamp, redirectUri, sig: signature })).toString("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return { url: `${PROCORE_OAUTH_BASE}/authorize?${params.toString()}`, state };
}

export function validateProcoreOAuthState(state: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    const { nonce, timestamp, redirectUri, sig } = decoded;
    if (!nonce || !timestamp || !redirectUri || !sig) return null;
    const elapsed = Date.now() - parseInt(timestamp, 10);
    if (elapsed > 600_000) return null;
    const expectedSig = signState(`${nonce}:${timestamp}:${redirectUri}`);
    if (sig !== expectedSig) return null;
    return redirectUri;
  } catch {
    return null;
  }
}

export async function exchangeProcoreCode(code: string, redirectUri: string) {
  const clientId = await resolveCredential("procore_client_id") ?? process.env.PROCORE_CLIENT_ID;
  const clientSecret = await resolveCredential("procore_client_secret") ?? process.env.PROCORE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Procore credentials not configured");

  const response = await fetch(`${PROCORE_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Procore token exchange failed: ${text}`);
  }

  return response.json() as Promise<{ access_token: string; refresh_token?: string; expires_in?: number }>;
}

export async function refreshProcoreToken(refreshToken: string) {
  const clientId = await resolveCredential("procore_client_id") ?? process.env.PROCORE_CLIENT_ID;
  const clientSecret = await resolveCredential("procore_client_secret") ?? process.env.PROCORE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Procore credentials not configured");

  const response = await fetch(`${PROCORE_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Procore token refresh failed: ${text}`);
  }

  return response.json() as Promise<{ access_token: string; refresh_token?: string; expires_in?: number }>;
}

function formatProcoreError(status: number, text: string): string {
  try {
    const json = JSON.parse(text);
    return json.message ?? json.error ?? json.errors?.join(", ") ?? `HTTP ${status}`;
  } catch {
    if (text.includes("<html") || text.includes("<!DOCTYPE")) {
      if (status === 404) return "Resource not found. The tool may not be enabled for this project.";
      if (status === 403) return "Access denied. You may not have permission for this resource.";
      return `HTTP ${status} error`;
    }
    return text.slice(0, 300);
  }
}

/**
 * READ-ONLY: Performs a GET request to the Procore API.
 * No POST, PUT, PATCH, or DELETE are exposed.
 */
export async function procoreApiGet<T = unknown>(
  accessToken: string,
  path: string,
  companyId?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (companyId) headers["Procore-Company-Id"] = companyId;

  const response = await fetch(`${PROCORE_API_BASE}${path}`, { method: "GET", headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Procore API (${response.status}): ${formatProcoreError(response.status, text)}`);
  }

  return response.json() as Promise<T>;
}

// --- READ-ONLY helpers ---

export async function getProcoreCompanies(accessToken: string) {
  return procoreApiGet(accessToken, "/rest/v1.0/companies");
}

export async function getProcoreMe(accessToken: string) {
  return procoreApiGet<{ id: number; login: string; email_address: string; name?: string }>(
    accessToken,
    "/rest/v1.0/me"
  );
}

export async function getProcoreProjects(accessToken: string, companyId: string) {
  return procoreApiGet(accessToken, `/rest/v1.0/companies/${companyId}/projects`);
}

export async function getProcoreProject(accessToken: string, companyId: string, projectId: string) {
  return procoreApiGet(accessToken, `/rest/v1.0/companies/${companyId}/projects/${projectId}`);
}

export async function getProcoreProjectUsers(accessToken: string, companyId: string, projectId: string) {
  return procoreApiGet(accessToken, `/rest/v1.0/companies/${companyId}/projects/${projectId}/users`);
}

export async function getProcoreBidPackages(accessToken: string, companyId: string, projectId: string) {
  return procoreApiGet(accessToken, `/rest/v1.0/companies/${companyId}/projects/${projectId}/bid_packages`);
}
