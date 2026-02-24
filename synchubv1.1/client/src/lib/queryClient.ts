import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const API = "/api";

export async function api(method: string, path: string, data?: unknown): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

export async function apiJson<T>(method: string, path: string, data?: unknown): Promise<T> {
  const res = await api(method, path, data);
  return res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 60_000 },
    mutations: { retry: false },
  },
});
