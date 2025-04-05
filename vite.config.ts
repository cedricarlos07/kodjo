import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Base URL pour cPanel
const base = './'

export default defineConfig({
  base,
  build: {
    sourcemap: true,
    minify: false,
    outDir: 'dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
        test: path.resolve(__dirname, 'client/public/index-test.html')
      }
    }
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
