// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 1. CRITICAL FIX: Define the missing global variables
  define: {
    // Tells simple-peer that the environment is not Node.js
    // This stops it from looking for 'global' and other Node-specific properties
    global: '({})',
  },
  
  // 2. Optional: If you run into issues with 'Buffer' being undefined later, 
  // you might need this configuration as well.
  // resolve: {
  //   alias: {
  //     // Alias 'buffer' to use a browser-compatible polyfill
  //     buffer: 'buffer/', 
  //   },
  // },

  // Optional: If you need to proxy API calls back to your Node.js server (port 3001)
  server: {
    port: 5173, // Your frontend port
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3001',
    //     changeOrigin: true,
    //     secure: false,
    //   }
    // }
  }
});