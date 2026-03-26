import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three-core";
          if (id.includes("node_modules/react")) return "react-core";
          if (id.includes("/src/mesh/")) return "mesh-core";
          if (id.includes("/src/components/")) return "components";
        },
      },
    },
  },
  optimizeDeps: {
    include: ["three", "react", "react-dom"],
  },
  server: {
    port: 5173,
    hmr:  true,
  },
});
