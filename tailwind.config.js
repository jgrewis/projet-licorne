/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          500: '#4169e1',
          600: '#3457c8',
          700: '#2645ae',
        },
      },
    },
  },
  plugins: [],
}
