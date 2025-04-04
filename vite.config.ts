import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
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
            warning.message.includes('file-saver')) {
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
