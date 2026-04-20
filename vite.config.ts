import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.svg'],
          manifest: false,
          workbox: {
            cleanupOutdatedCaches: true,
            navigateFallback: '/index.html',
            maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
            navigateFallbackDenylist: [
              /^\/#\/signin/,
              /^https:\/\/.*\.supabase\.co\/.*/i,
            ],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkOnly',
              },
              {
                urlPattern: ({ request, url }) =>
                  request.destination === 'image' && url.origin === self.location.origin,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'local-images',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 7 * 24 * 60 * 60,
                  },
                },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
