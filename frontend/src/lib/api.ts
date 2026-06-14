import axios from "axios";
import type { AuthTokens } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function persistTokens(tokens: AuthTokens) {
  localStorage.setItem("flowchat_tokens", JSON.stringify(tokens));
  setAuthToken(tokens.accessToken);
}

export function readStoredTokens(): AuthTokens | null {
  const raw = localStorage.getItem("flowchat_tokens");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    localStorage.removeItem("flowchat_tokens");
    return null;
  }
}

export function clearStoredTokens() {
  localStorage.removeItem("flowchat_tokens");
  setAuthToken(undefined);
}

