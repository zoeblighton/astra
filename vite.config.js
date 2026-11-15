import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 127.0.0.1 (not localhost) so the backend's login cookie is shared and
    // matches the Spotify Redirect URI host.
    host: '127.0.0.1',
    port: 5173,
    // Forward /api/* to FastAPI: same origin for the browser, no CORS needed.
    proxy: {
      '/api': process.env.ASTRA_API_URL || 'http://127.0.0.1:8000',
    },
  },
});
