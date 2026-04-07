import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000, // Supprime l'avertissement
    rollupOptions: {
      output: {
        manualChunks: {
          // Optimisation optionnelle : sépare les grosses dépendances
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
}));
