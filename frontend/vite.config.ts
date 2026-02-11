import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export const API_BASE = import.meta.env.VITE_API_BASE;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
