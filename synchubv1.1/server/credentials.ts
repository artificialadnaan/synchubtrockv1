import { storage } from "./storage";

const CRED_KEYS = [
  "procore_client_id",
  "procore_client_secret",
  "hubspot_access_token",
  "google_client_id",
  "google_client_secret",
  "microsoft_client_id",
  "microsoft_client_secret",
  "public_url",
] as const;

export function getCredential(key: (typeof CRED_KEYS)[number]): string | undefined {
  const envMap: Record<string, string | undefined> = {
    procore_client_id: process.env.PROCORE_CLIENT_ID,
    procore_client_secret: process.env.PROCORE_CLIENT_SECRET,
    hubspot_access_token: process.env.HUBSPOT_ACCESS_TOKEN,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
    microsoft_client_id: process.env.MICROSOFT_CLIENT_ID,
    microsoft_client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    public_url: process.env.PUBLIC_URL,
  };
  const envVal = envMap[key];
  if (envVal) return envVal;
  return undefined;
}

export async function getCredentialFromDb(key: string): Promise<string | undefined> {
  return storage.credentials.get(key);
}

export async function resolveCredential(key: string): Promise<string | undefined> {
  const fromDb = await getCredentialFromDb(key);
  if (fromDb) return fromDb;
  if (CRED_KEYS.includes(key as (typeof CRED_KEYS)[number])) {
    return getCredential(key as (typeof CRED_KEYS)[number]);
  }
  return undefined;
}
