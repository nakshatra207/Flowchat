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
    avatarUrl: row.avatar_url as string | null,
    bio: (row.bio as string) ?? "",
    statusMessage: (row.status_message as string) ?? "",
    role: (row.role as User["role"]) ?? "user",
    presence: (row.presence as User["presence"]) ?? "offline",
    lastSeenAt: row.last_seen_at as string | null
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("id, email, username, display_name, avatar_url, bio, status_message, role, presence, last_seen_at")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return dbRowToUser(data as Record<string, unknown>);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async login(emailOrUsername, password) {
    let email = emailOrUsername;

    // Username login: look up email first (this works as anon since users are public-readable)
    if (!emailOrUsername.includes("@")) {
      const { data: row, error: lookupErr } = await supabase
        .from("users")
        .select("email")
        .eq("username", emailOrUsername)
        .maybeSingle();
      if (lookupErr || !row) throw new Error("No account found with that username.");
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
      email,
      password,
      options: {
        data: { username, display_name: displayName },
        // Skip email confirmation for this app
        emailRedirectTo: undefined
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Registration failed. Please try again.");

    // If we have a session the user is signed in immediately (email confirm disabled)
    if (data.session) {
      // Give the DB trigger a moment to create the public.users row
      await new Promise((r) => setTimeout(r, 800));
      const profile = await fetchProfile(data.user.id);
      set({ user: profile });
      return;
    }

    // Email confirmation required — inform user
    throw new Error("Check your email to confirm your account, then sign in.");
  },

  async bootstrap() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      set({ loading: false });
      return;
    }
    const profile = await fetchProfile(session.user.id);
    set({ user: profile, loading: false });
  },

  async logout() {
    await supabase.auth.signOut();
    set({ user: null });
  },

  updateUser(user) {
    set({ user });
  }
}));
