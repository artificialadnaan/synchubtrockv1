export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
}

// Auth disabled for development - always return a dev user
const DEV_USER: AuthUser = { id: "dev-user-id", email: "dev@local", role: "admin" };

export function useAuth() {
  return { user: DEV_USER, isLoading: false };
}
