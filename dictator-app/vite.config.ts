import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import EnvironmentPlugin from 'vite-plugin-environment'

export default defineConfig({
  plugins: [
    react(),
    // This makes 'process.env' work in the browser
    EnvironmentPlugin('all') 
  ],
})
