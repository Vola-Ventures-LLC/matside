import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  envDir: path.resolve(__dirname, "../.."),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],

          // UI library
          'vendor-ui': ['@saas-infra/ui'],

          // Data fetching and state
          'vendor-query': ['@tanstack/react-query'],

          // Rich text editor
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-heading',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
          ],

          // Charts and visualization
          'vendor-charts': ['recharts'],

          // Utilities
          'vendor-utils': ['date-fns', 'zod', 'lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit since we're code splitting
    chunkSizeWarningLimit: 600,
  },
}));
