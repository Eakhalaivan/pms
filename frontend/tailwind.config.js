/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Main buttons, accents
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        tableHeader: '#1e3a8a',
        sidebarBg: '#0f172a',
        background: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
