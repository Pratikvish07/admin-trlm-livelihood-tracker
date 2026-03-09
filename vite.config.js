import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ext-api': {
        target: 'https://trlm.pickitover.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ext-api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Useful in local terminal when upstream fails and Vite returns 500.
            // eslint-disable-next-line no-console
            console.error('Vite proxy error:', err.message);
          });
        },
      },
    },
  },
});
