/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors found in your Settings.tsx and constants
      colors: {
        dictator: {
          lime: '#AFFC41',
          pale: '#FEFFA7',
          teal: '#1DD3B0',
          olive: '#B9E769',
          gold: '#FFD700',
        }
      }
    },
  },
  plugins: [],
}
