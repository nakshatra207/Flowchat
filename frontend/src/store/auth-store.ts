import { create } from "zustand";
import { api, clearStoredTokens, persistTokens, readStoredTokens, setAuthToken } from "../lib/api";
import { resetSocket } from "../lib/socket";
import type { AuthTokens, User } from "../types/api";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (payload: { email: string; username: string; displayName: string; password: string }) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: readStoredTokens(),
  loading: true,
  async login(emailOrUsername, password) {
    const { data } = await api.post<{ user: User; tokens: AuthTokens }>("/auth/login", {
      emailOrUsername,
      password
    });
    persistTokens(data.tokens);
    set({ user: data.user, tokens: data.tokens });
  },
  async register(payload) {
    const { data } = await api.post<{ user: User; tokens: AuthTokens }>("/auth/register", payload);
    persistTokens(data.tokens);
    set({ user: data.user, tokens: data.tokens });
  },
  async bootstrap() {
    const tokens = get().tokens ?? readStoredTokens();
    if (!tokens) {
      set({ loading: false });
      return;
    }

    setAuthToken(tokens.accessToken);
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      set({ user: data.user, tokens, loading: false });
    } catch {
      clearStoredTokens();
      set({ user: null, tokens: null, loading: false });
    }
  },
  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearStoredTokens();
      resetSocket();
      set({ user: null, tokens: null });
    }
  },
  updateUser(user) {
    set({ user });
  }
}));

