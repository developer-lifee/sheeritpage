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
        },
        gray: {
          150: '#f1f3f5',
          450: '#8392a5',
          750: '#262f3d',
          850: '#151c2c'
        }
      }
    },
  },
  plugins: [],
};