import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Firebase's signInWithPopup polls window.closed on the Google popup, which the
// default opener policy severs. Allowing popups keeps that handle usable.
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { headers },
  preview: { headers },
})
