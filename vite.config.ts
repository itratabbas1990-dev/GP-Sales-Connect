
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The last parameter '' ensures we load all env vars, not just VITE_*
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // On Vercel, process.env is populated. Locally, loadEnv populates 'env'.
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This allows 'process.env.API_KEY' to work in the browser code
      // by replacing it with the string value during build.
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
