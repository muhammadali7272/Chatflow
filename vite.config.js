import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind IPv4 explicitly. The default "localhost" resolves to ::1 first on
    // Node 17+, so the server ended up listening only on IPv6 and every
    // browser-automation tool that dials 127.0.0.1:5173 got ECONNREFUSED.
    host: "127.0.0.1",
  },
});
