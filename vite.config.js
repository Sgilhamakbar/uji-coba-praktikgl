import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'; // 🟢 1. Import plugin PWA

export default defineConfig({
  base: './', 
  
  // 🟢 2. Tambahkan pengaturan plugins PWA di sini
  plugins: [
    VitePWA({
      registerType: 'prompt', // Otomatis mengupdate cache di HP jika ada versi web baru
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // Aset statis pendukung
      manifest: {
        name: 'Simulator Rangkaian Digital', // Nama panjang aplikasi saat diinstall
        short_name: 'Simulasi Lab', // Nama pendek di bawah ikon HP
        description: 'Aplikasi Simulator Rangkaian Listrik dan Logika Digital',
        theme_color: '#ffffff', // Warna tema bar di HP
        background_color: '#ffffff',
        display: 'standalone', // Hilangkan address bar browser (terlihat seperti app asli)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Mendukung bentuk ikon adaptif Android
          }
        ]
      },
      workbox: {
        // 🟢 3. Pengaturan Offline: Cache semua file HTML, CSS, JS, dan Gambar
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'] 
      }
    })
  ],

  server: {
    port: 3000, 
    open: true, 
  },
  
  build: {
    outDir: 'dist', 
    target: 'esnext', 
    minify: 'esbuild', 
    emptyOutDir: true, 
  }
});