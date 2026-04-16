import path from "path";

import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "robots.txt", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Mãe Consciente",
        short_name: "MãeConsciente",
        description: "Tudo para sua gestação e pós-parto em um só app",
        theme_color: "#F8EDEE",
        background_color: "#FFFDF9",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["lifestyle", "health", "parenting"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Diário do Sono",
            short_name: "Sono",
            description: "Registrar sono do bebê",
            url: "/diario-sono",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Amamentação",
            short_name: "Amamentar",
            description: "Registrar mamada",
            url: "/amamentacao",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Dashboard Bebê",
            short_name: "Bebê",
            description: "Ver resumo do bebê",
            url: "/dashboard-bebe",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webp,jpg,jpeg}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // CORREÇÃO CRÍTICA: Usar index.html (arquivo real pré-cacheado) ao invés de /offline (rota React)
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // CORREÇÃO: Forçar ativação imediata do novo SW para aplicar mudanças
        skipWaiting: true,
        runtimeCaching: [
          // JS Assets - NetworkFirst para evitar cache desatualizado após deploy
          {
            urlPattern: /\/assets\/.*\.js$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "js-assets",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts - Cache first (static)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase API - Stale while revalidate for better UX
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 10, // 10 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              backgroundSync: {
                name: "supabase-api-sync",
                options: {
                  maxRetentionTime: 24 * 60, // 24 hours
                },
              },
            },
          },
          // Supabase Storage - Cache first for images
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-public",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase Storage - Network first for private
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/sign\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-storage-private",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase Edge Functions - Network only with fallback
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "edge-functions-sync",
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          // External images (CDN)
          {
            urlPattern: /^https:\/\/.*\.(cloudflare|cloudinary|imgix|fastly)\..*\.(png|jpg|jpeg|webp|gif|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        // ABORDAGEM MINIMALISTA: Evita problemas de ordem de carregamento
        // Mantém React, Radix, e dependências críticas no mesmo chunk
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Apenas separar bibliotecas pesadas que são lazy loaded
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('jspdf')) return 'pdf';
            // Todo o resto fica em vendor (React, Radix, Recharts, etc)
            return 'vendor';
          }
        },
      },
    },
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "src/integrations/supabase/types.ts",
      ],
    },
  },
}));
