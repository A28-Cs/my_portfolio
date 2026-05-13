import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home:      resolve(__dirname, 'index.html'),
        about:     resolve(__dirname, 'about.html'),
        projects:  resolve(__dirname, 'projects.html'),
        services:  resolve(__dirname, 'services.html'),
        experience: resolve(__dirname, 'experience.html'),
        contact:   resolve(__dirname, 'contact.html'),
        adminLogin: resolve(__dirname, 'admin/login.html'),
        adminDash:  resolve(__dirname, 'admin/dashboard.html'),
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/scripts'),
      '@styles': resolve(__dirname, 'src/styles')
    }
  }
});
