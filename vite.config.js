import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  optimizeDeps: {
    include: ["react-photo-sphere-viewer", "@photo-sphere-viewer/core"],
  },
  ssr: {
    noExternal: ["react-photo-sphere-viewer", "@photo-sphere-viewer/core"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
