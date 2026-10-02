/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // index.html links the personalized static manifest. Avoid a competing
      // generated manifest with the package's template name.
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,ogg,webmanifest}"],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
