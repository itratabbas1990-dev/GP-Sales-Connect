
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Golden Pearl Sales Connect',
          short_name: 'GP Sales',
          description: 'Market Visit Reporting Tool for Golden Pearl Cosmetics',
          theme_color: '#d09032',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Placeholder Gold Icon
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Placeholder Gold Icon
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          // Increase limit for caching photos taken
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
