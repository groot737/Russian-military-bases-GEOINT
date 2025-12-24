/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          light: 'rgba(255,255,255,0.7)',
          dark: 'rgba(17,24,39,0.7)'
        }
      },
      boxShadow: {
        soft: '0 6px 20px rgba(0,0,0,0.08)'
      },
      borderRadius: {
        xl: '16px'
      }
    }
  },
  darkMode: 'class',
  plugins: []
};
