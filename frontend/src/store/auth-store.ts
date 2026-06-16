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

async function fetchProfile(userId: string, retries = 4): Promise<User | null> {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase
      .from("users")
      .select("id, email, username, display_name, avatar_url, bio, status_message, role, presence, last_seen_at")
      .eq("id", userId)
      .maybeSingle();
    if (data) return dbRowToUser(data as Record<string, unknown>);
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 700));
  }
  return null;
}

async function setPresence(userId: string, presence: "online" | "offline") {
  await supabase
    .from("users")
    .update({ presence, last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
      email = (row as { email: string }).email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Login failed. Please try again.");

    const profile = await fetchProfile(data.user.id);
    if (profile) await setPresence(profile.id, "online");
    set({ user: profile ? { ...profile, presence: "online" } : null });
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

    if (!data.session) {
      throw new Error("Please check your email to confirm your account, then sign in.");
    }

    const profile = await fetchProfile(data.user.id, 5);
    if (profile) await setPresence(profile.id, "online");
    set({ user: profile ? { ...profile, presence: "online" } : null });
  },

  async bootstrap() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ loading: false });
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (profile) await setPresence(profile.id, "online");
      set({ user: profile ? { ...profile, presence: "online" } : null, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  async logout() {
    const { user } = get();
    if (user) await setPresence(user.id, "offline");
    await supabase.auth.signOut();
    set({ user: null });
  },

  updateUser(user) {
    set({ user });
  },
}));
