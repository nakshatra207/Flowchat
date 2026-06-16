import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, ".."),
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:4000",
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true
      },
      "/uploads": "http://localhost:4000"
    }
  }
});

