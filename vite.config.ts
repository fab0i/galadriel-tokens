import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "favicon-96x96.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "Token Tracker",
        short_name: "Tokens",
        description: "Track creature token stacks for Magic: The Gathering.",
        display: "standalone",
        background_color: "#100f14",
        theme_color: "#100f14",
        icons: [
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://cards.scryfall.io",
            handler: "CacheFirst",
            options: {
              cacheName: "scryfall-images",
              expiration: { maxEntries: 500, maxAgeSeconds: ONE_YEAR_SECONDS },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
});
