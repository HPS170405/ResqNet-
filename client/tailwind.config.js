/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#f8fafc',      // clean slate-50 background
          yellow: '#f59e0b',  // warning amber-500
          blue: '#0ea5e9',    // energetic sky-500
          orange: '#f97316',  // safety orange-500
          navy: '#0f172a',    // clean dark slate for text/headers
          success: '#10b981', // green-500
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
