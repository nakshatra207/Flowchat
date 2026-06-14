import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
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

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = readStoredTokens();
      if (!tokens?.refreshToken) {
        clearStoredTokens();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{ tokens: AuthTokens }>(`${API_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken
        });

        persistTokens(data.tokens);
        processQueue(null, data.tokens.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredTokens();
        processQueue(refreshError as Error, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
