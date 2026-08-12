import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built assets resolve correctly regardless of the
  // repo name GitHub Pages serves this under (https://<user>.github.io/<repo>/).
  base: './',
  plugins: [react()],
})
