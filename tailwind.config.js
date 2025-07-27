/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aviator-blue': '#0066cc',
        'aviator-dark': '#003366',
        'aviator-light': '#f0f8ff',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 