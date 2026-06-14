import { io, type Socket } from "socket.io-client";
import { readStoredTokens } from "./api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const tokens = readStoredTokens();
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: tokens?.accessToken
      }
    });
  }

  return socket;
}

export function updateSocketToken() {
  if (socket) {
    const tokens = readStoredTokens();
    if (tokens?.accessToken) {
      socket.auth = { token: tokens.accessToken };
    }
  }
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

