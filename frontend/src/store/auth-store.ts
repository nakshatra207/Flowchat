import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { User } from "../types/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (payload: { email: string; username: string; displayName: string; password: string }) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

function dbRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    username: row.username as string,
    displayName: (row.display_name as string) ?? "",
    avatarUrl: (row.avatar_url as string) ?? null,
    bio: (row.bio as string) ?? "",
    statusMessage: (row.status_message as string) ?? "",
    role: (row.role as User["role"]) ?? "user",
    presence: (row.presence as User["presence"]) ?? "offline",
    lastSeenAt: (row.last_seen_at as string) ?? null,
  };
}

async function fetchProfile(userId: string, retries = 3): Promise<User | null> {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username, display_name, avatar_url, bio, status_message, role, presence, last_seen_at")
      .eq("id", userId)
      .maybeSingle();

    if (data) return dbRowToUser(data as Record<string, unknown>);
    // Row not yet created by trigger — wait and retry
    if (!error && !data && i < retries - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async login(emailOrUsername, password) {
    let email = emailOrUsername.trim();

    if (!email.includes("@")) {
      const { data: row } = await supabase
        .from("users")
        .select("email")
        .eq("username", email)
        .maybeSingle();
      if (!row) throw new Error("No account found with that username.");
      email = row.email as string;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Login failed. Please try again.");

    const profile = await fetchProfile(data.user.id);
    set({ user: profile });
  },

  async register({ email, username, displayName, password }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim(), display_name: displayName.trim() },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Registration failed. Please try again.");

    // No session means email confirmation is required
    if (!data.session) {
      throw new Error("Please check your email to confirm your account, then sign in.");
    }

    // Session exists — user is logged in. Retry profile fetch until trigger creates the row.
    const profile = await fetchProfile(data.user.id, 5);
    set({ user: profile });
  },

  async bootstrap() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ loading: false });
        return;
      }
      const profile = await fetchProfile(session.user.id);
      set({ user: profile, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  async logout() {
    await supabase.auth.signOut();
    set({ user: null });
  },

  updateUser(user) {
    set({ user });
  },
}));
