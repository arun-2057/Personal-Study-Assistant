import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    const user = { id: data.id, email: data.email, name: data.name };
    if (typeof window !== "undefined") {
      localStorage.setItem("studyflow_user", JSON.stringify(user));
    }
    set({ user });
  },

  register: async (email: string, name: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    const user = { id: data.id, email: data.email, name: data.name };
    if (typeof window !== "undefined") {
      localStorage.setItem("studyflow_user", JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("studyflow_user");
    }
    set({ user: null });
  },

  checkSession: async () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    const stored = localStorage.getItem("studyflow_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        // Verify session is still valid
        const res = await fetch("/api/auth/session", {
          headers: { "x-user-id": user.id },
        });
        if (res.ok) {
          set({ user, isLoading: false });
          return;
        }
      } catch {
        // Invalid stored data
      }
      localStorage.removeItem("studyflow_user");
    }
    set({ isLoading: false });
  },
}));

// Helper to get auth headers
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem("studyflow_user");
  if (!stored) return {};
  try {
    const user = JSON.parse(stored);
    return { "x-user-id": user.id };
  } catch {
    return {};
  }
}
