import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
}

export function useAuth() {
  const { data, isLoading } = useQuery<{ user: AuthUser } | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      return res.json();
    },
    retry: false,
  });

  return { user: data?.user ?? null, isLoading };
}
