/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4fe4ef',
          light: '#7eedf5',
          dark: '#3cb4bd'
        }
      }
    },
  },
  plugins: [],
};