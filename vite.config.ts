import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Déterminer la base URL en fonction de l'environnement
const base = process.env.GITHUB_ACTIONS ? '/kodjo/' : './'

export default defineConfig({
  base,
  build: {
    sourcemap: true,
    minify: false,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: ['@tanstack/react-table', 'jspdf', 'jspdf-autotable', 'file-saver'],
      onwarn(warning, warn) {
        // Ignorer les avertissements spécifiques
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
            warning.message.includes('react-countup') ||
            warning.message.includes('@tanstack/react-table') ||
            warning.message.includes('jspdf') ||
            warning.message.includes('jspdf-autotable') ||
            warning.message.includes('file-saver') ||
            warning.message.includes('Browserslist') ||
            warning.message.includes('browsers data')) {
          return;
        }
        warn(warning);
      }
    },
    // Ensure that the SPA fallback works correctly
    assetsDir: "assets",
    // Generate a _redirects file for Vercel
    copyPublicDir: true,
  },
});
