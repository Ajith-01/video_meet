// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  define: {
    // ⭐️ CRUCIAL FIX: Define 'global' as 'window' or 'self' ⭐️
    // 'window' is the most robust browser global object.
    global: 'window', 
    
    // You may also need to define 'process.env.NODE_ENV' for some libraries
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  
  // NOTE: If you run into issues with 'Buffer' being undefined, 
  // you will need a polyfill package and to configure 'resolve.alias'.
});